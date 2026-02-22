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
	/** True when the user is authenticated but has no club memberships yet. */
	needsClub = $state(false);
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
			await this.initializeByMode();
		} catch (err) {
			this.handleInitializationError(err);
			console.error('[AppInit] Failed:', err);
		}
	}

	private async initializeByMode(): Promise<void> {
		if (this.isMockMode()) {
			await this.startMockMode();
			return;
		}

		await initTracing();
		const authResult = await this.authenticateAndLoadGuild();
		await this.completeAuthenticatedInitialization(authResult);
	}

	private async completeAuthenticatedInitialization(
		authResult: AuthInitializeResult
	): Promise<void> {
		if (!authResult.authenticated) {
			this.setDisconnectedReady();
			return;
		}

		if (!auth.user?.clubs?.length) {
			this.setNeedsClubReady();
			return;
		}

		this.needsClub = false;

		if (!authResult.switchedClubWithDataLoad) {
			await this.connectAndLoad();
		}
		this.ensureReconnectRecovery();
		this.setLiveReady();
	}

	private setDisconnectedReady(): void {
		this.mode = 'disconnected';
		this.status = 'ready';
	}

	private setNeedsClubReady(): void {
		this.needsClub = true;
		this.mode = 'disconnected';
		this.status = 'ready';
	}

	private setLiveReady(): void {
		this.mode = 'live';
		this.status = 'ready';
	}

	private handleInitializationError(err: unknown): void {
		this.status = 'error';
		this.mode = 'disconnected';
		this.error = this.toErrorMessage(err);
	}

	private toErrorMessage(err: unknown): string {
		if (err instanceof Error) {
			return err.message;
		}

		if (typeof err === 'string' && err.trim().length > 0) {
			return err;
		}

		try {
			return JSON.stringify(err);
		} catch {
			return 'Initialization failed';
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

		const allowProdMock = env.PUBLIC_ALLOW_MOCK_PROD === 'true';

		if (!import.meta.env.DEV && !allowProdMock) {
			if (mockFlagSet) {
				console.warn('[AppInit] Mock mode requested outside development build; ignoring.');
			}
			return false;
		}

		return mockFlagSet;
	}

	private async startMockMode(): Promise<void> {
		const allowProdMock = env.PUBLIC_ALLOW_MOCK_PROD === 'true';

		if (!import.meta.env.DEV && !allowProdMock) {
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
			],
			linkedProviders: []
		};
		auth.status = 'authenticated';

		this.mode = 'mock';
		this.status = 'ready';

		// Defer heavy data generation to next tick to unblock main thread and allow initial paint
		setTimeout(() => {
			mockDataProvider.start();
		}, 0);
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
