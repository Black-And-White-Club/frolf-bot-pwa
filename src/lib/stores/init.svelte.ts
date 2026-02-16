/**
 * App Initializer
 * Orchestrates startup sequence: OTel -> Auth -> NATS -> Subscriptions
 * Supports mock mode for development without live NATS connection
 */

import { browser } from '$app/environment';
import { auth, type AuthInitializeResult } from './auth.svelte';
import { nats } from './nats.svelte';
import { subscriptionManager } from './subscriptions.svelte';
import { dataLoader } from './dataLoader.svelte';
import { initTracing } from '$lib/otel/tracing';
import { env } from '$env/dynamic/public';
// import { mockDataProvider } from '$lib/mocks/mockDataProvider.svelte';
import { clubService } from './club.svelte';

type InitStatus = 'idle' | 'initializing' | 'ready' | 'error';
type InitMode = 'live' | 'mock' | 'disconnected';

class AppInitializer {
	status = $state<InitStatus>('idle');
	mode = $state<InitMode>('disconnected');
	error = $state<string | null>(null);
	private initPromise: Promise<void> | null = null;
	private connectAndLoadPromise: Promise<void> | null = null;
	private reconnectUnsubscribe: (() => void) | null = null;
	private reconnectReloadTimer: ReturnType<typeof setTimeout> | null = null;

	isReady = $derived(this.status === 'ready');
	isLoading = $derived(this.status === 'initializing');

	async initialize(): Promise<void> {
		if (!browser || this.status === 'ready') return;
		if (this.initPromise) return this.initPromise;

		this.initPromise = this.doInitialize();
		try {
			await this.initPromise;
		} finally {
			if (this.initPromise) {
				this.initPromise = null;
			}
		}
	}

	private async doInitialize(): Promise<void> {
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

			// Perform authentication and optional club switch/load path
			const authResult = await this.authenticateAndLoadGuild();
			if (!authResult.authenticated) {
				// Not authenticated — stay in disconnected mode
				this.mode = 'disconnected';
				this.status = 'ready';
				return;
			}

			// If auth initialization already switched clubs and loaded data, don't duplicate it.
			if (!authResult.switchedClubWithDataLoad) {
				await this.connectAndLoad();
			}
			this.ensureReconnectRecovery();

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
		const envMockEnabled = env.PUBLIC_USE_MOCK === 'true';
		const mockFlagSet = (() => {
			try {
				const urlParams = new URLSearchParams(window.location.search);
				return urlParams.get('mock') === 'true' || envMockEnabled;
			} catch {
				return envMockEnabled;
			}
		})();

		if (!import.meta.env.DEV) {
			if (mockFlagSet) {
				console.warn('[AppInit] Mock mode requested outside development build; ignoring.');
			}
			return false;
		}

		return mockFlagSet;
	}

	private async startMockMode(): Promise<void> {
		if (!import.meta.env.DEV) {
			throw new Error('Mock mode is disabled outside development builds');
		}

		// step 1: dynamic import to avoid bundling mocks in production
		const { mockDataProvider } = await import('$lib/mocks/mockDataProvider.svelte');
		console.log('[AppInit] Starting in mock mode');

		// Mock Auth
		auth.user = {
			id: 'user-1',
			uuid: 'user-uuid-1',
			activeClubUuid: 'guild-123',
			guildId: 'guild-123',
			role: 'admin',
			clubs: [
				{
					club_uuid: 'guild-123',
					role: 'admin',
					display_name: 'Mock User',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
				}
			]
		};
		auth.status = 'authenticated';

		mockDataProvider.start();
		this.mode = 'mock';
		this.status = 'ready';
	}

	private async authenticateAndLoadGuild(): Promise<AuthInitializeResult> {
		// Initialize auth (extracts token, validates)
		const result = await auth.initialize();

		return {
			authenticated: Boolean(auth.isAuthenticated && auth.token),
			switchedClubWithDataLoad: result.switchedClubWithDataLoad
		};
	}

	private async connectAndLoad(): Promise<void> {
		if (this.connectAndLoadPromise) {
			return this.connectAndLoadPromise;
		}

		this.connectAndLoadPromise = this.doConnectAndLoad();
		try {
			await this.connectAndLoadPromise;
		} finally {
			this.connectAndLoadPromise = null;
		}
	}

	private async doConnectAndLoad(): Promise<void> {
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

		this.ensureReconnectRecovery();

		// Start loading club info right away once connected.
		const clubLoadPromise = clubService.loadClubInfo().catch((e) => {
			console.warn('[AppInit] Failed to load club info:', e);
		});

		// Start subscriptions and load initial data using the preferred identity (Club UUID)
		const subscriptionId = auth.user?.activeClubUuid || auth.user?.guildId;
		if (subscriptionId) {
			subscriptionManager.start(subscriptionId);
			await Promise.all([dataLoader.loadInitialData(), clubLoadPromise]);
			return;
		}

		await clubLoadPromise;
	}

	private ensureReconnectRecovery(): void {
		if (this.reconnectUnsubscribe) return;

		this.reconnectUnsubscribe = nats.onReconnect(() => {
			if (this.reconnectReloadTimer) {
				clearTimeout(this.reconnectReloadTimer);
			}

			this.reconnectReloadTimer = setTimeout(async () => {
				const subscriptionId = auth.user?.activeClubUuid || auth.user?.guildId;
				if (!subscriptionId) return;

				// Re-establish subscriptions and fetch fresh snapshots in case events were missed.
				subscriptionManager.start(subscriptionId);
				await dataLoader.loadInitialData();
			}, 400);
		});
	}

	async teardown(): Promise<void> {
		if (this.reconnectReloadTimer) {
			clearTimeout(this.reconnectReloadTimer);
			this.reconnectReloadTimer = null;
		}
		if (this.reconnectUnsubscribe) {
			this.reconnectUnsubscribe();
			this.reconnectUnsubscribe = null;
		}

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
