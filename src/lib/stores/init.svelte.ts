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
import { mockDataProvider } from '$lib/mocks/mockDataProvider.svelte';
import { guildService } from './guild.svelte';

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
				this.startMockMode();
				return;
			}

			// Perform authentication and optional guild load
			const authenticated = await this.authenticateAndLoadGuild();
			if (!authenticated) {
				// Not authenticated: mark ready but disconnected
				console.log('[AppInit] No token found, staying disconnected');
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

	private startMockMode(): void {
		console.log('[AppInit] Starting in mock mode');
		mockDataProvider.start();
		this.mode = 'mock';
		this.status = 'ready';
	}

	private async authenticateAndLoadGuild(): Promise<boolean> {
		// Initialize auth (extracts token, validates)
		auth.initialize();

		if (auth.isAuthenticated) {
			try {
				await guildService.loadGuildInfo();
			} catch (e) {
				// non-fatal: continue even if guild load fails
				console.warn('[AppInit] Failed to load guild info:', e);
			}
		}

		return Boolean(auth.isAuthenticated && auth.token);
	}

	private async connectAndLoad(): Promise<void> {
		// Connect to NATS
		await nats.connect(auth.token as string);

		// Start subscriptions and load initial data if we have a guild
		if (auth.user?.guildId) {
			subscriptionManager.start(auth.user.guildId);
			await dataLoader.loadInitialData();
		}
	}

	async teardown(): Promise<void> {
		if (this.mode === 'mock') {
			mockDataProvider.stop();
		} else if (this.mode === 'live') {
			// Stop subscriptions
			subscriptionManager.stop();

			// Disconnect NATS
			nats.destroy();

			// Clear auth
			auth.signOut();

			// Clear guild info
			guildService.clear();
		}

		this.status = 'idle';
		this.mode = 'disconnected';
		this.error = null;
	}
}

export const appInit = new AppInitializer();
