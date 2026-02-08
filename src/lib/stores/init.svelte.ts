/**
 * App Initializer
 * Orchestrates startup sequence: OTel -> Auth -> NATS -> Subscriptions
 * Supports mock mode for development without live NATS connection
 */

import { browser } from '$app/environment';
import { auth } from './auth.svelte';
import { nats } from './nats.svelte';
import { subscriptionManager } from './subscriptions.svelte';
import { dataLoader } from './dataLoader.svelte';
import { initTracing } from '$lib/otel/tracing';
// import { mockDataProvider } from '$lib/mocks/mockDataProvider.svelte';
import { clubService } from './club.svelte';

type InitStatus = 'idle' | 'initializing' | 'ready' | 'error';
type InitMode = 'live' | 'mock' | 'disconnected';

class AppInitializer {
	status = $state<InitStatus>('idle');
	mode = $state<InitMode>('disconnected');
	error = $state<string | null>(null);

	isReady = $derived(this.status === 'ready');
	isLoading = $derived(this.status === 'initializing');

	async initialize(): Promise<void> {
		if (!browser || this.status === 'initializing' || this.status === 'ready') return;

		this.status = 'initializing';
		this.error = null;

		try {
			// Step 1: Initialize tracing
			await initTracing();

			// Handle mock mode early
			if (this.isMockMode()) {
				await this.startMockMode();
				return;
			}

			// Perform authentication and optional guild load
			const authenticated = await this.authenticateAndLoadGuild();
			if (!authenticated) {
				// Not authenticated: mark ready but disconnected
				// Not authenticated — stay in disconnected mode
				this.mode = 'disconnected';
				this.status = 'ready';
				return;
			}

			// Connect to NATS and load initial data/subscriptions
			await this.connectAndLoad();

			this.mode = 'live';
			this.status = 'ready';
		} catch (err) {
			this.status = 'error';
			this.mode = 'disconnected';
			this.error = err instanceof Error ? err.message : 'Initialization failed';
			console.error('[AppInit] Failed:', err);
		}
	}

	private isMockMode(): boolean {
		try {
			const urlParams = new URLSearchParams(window.location.search);
			return urlParams.get('mock') === 'true' || import.meta.env.VITE_USE_MOCK === 'true';
		} catch {
			return false;
		}
	}

	private async startMockMode(): Promise<void> {
		// step 1: dynamic import to avoid bundling mocks in production
		const { mockDataProvider } = await import('$lib/mocks/mockDataProvider.svelte');
		console.log('[AppInit] Starting in mock mode');
		mockDataProvider.start();
		this.mode = 'mock';
		this.status = 'ready';
	}

	private async authenticateAndLoadGuild(): Promise<boolean> {
		// Initialize auth (extracts token, validates)
		await auth.initialize();

		return Boolean(auth.isAuthenticated && auth.token);
	}

	private async connectAndLoad(): Promise<void> {
		// Connect to NATS with retry
		let connected = false;
		let attempts = 0;
		while (!connected && attempts < 3) {
			try {
				await nats.connect(auth.token as string);
				connected = true;
			} catch (e) {
				attempts++;
				if (attempts >= 3) throw e;
				console.warn(`[AppInit] NATS connection attempt ${attempts} failed, retrying...`, e);
				await new Promise((r) => setTimeout(r, 1000));
			}
		}

		// Now that NATS is connected, we can try loading club info.
		// This allows the NATS fallback to work if HTTP fails (CSP blocks, etc).
		try {
			await clubService.loadClubInfo();
		} catch (e) {
			console.warn('[AppInit] Failed to load club info:', e);
		}

		// Start subscriptions and load initial data using the preferred identity (Club UUID)
		const subscriptionId = auth.user?.activeClubUuid || auth.user?.guildId;
		if (subscriptionId) {
			subscriptionManager.start(subscriptionId);
			await dataLoader.loadInitialData();
		}
	}

	async teardown(): Promise<void> {
		if (this.mode === 'mock') {
			const { mockDataProvider } = await import('$lib/mocks/mockDataProvider.svelte');
			mockDataProvider.stop();
		} else if (this.mode === 'live') {
			// Stop subscriptions
			subscriptionManager.stop();

			// Disconnect NATS
			nats.destroy();

			// Clear auth
			auth.signOut();

			// Clear club info
			clubService.clear();
		}

		this.status = 'idle';
		this.mode = 'disconnected';
		this.error = null;
	}
}

export const appInit = new AppInitializer();
