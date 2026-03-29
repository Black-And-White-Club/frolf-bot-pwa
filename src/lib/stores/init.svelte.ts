/**
 * App Initializer
 * Orchestrates startup sequence: OTel -> Auth -> NATS -> Subscriptions
 * Supports mock mode for development without live NATS connection
 */

import { browser } from '$app/environment';
import { auth, type AuthInitializeResult } from './auth.svelte';
import { config } from '$lib/config';
import { env } from '$env/dynamic/public';

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
	// Lazily-loaded live-mode singletons — null until first live connection
	private liveModules: {
		nats: any;
		subscriptionManager: any;
		dataLoader: any;
		clubService: any;
	} | null = null;

	isReady = $derived(this.status === 'ready');
	isLoading = $derived(this.status === 'initializing');

	/**
	 * Called after successfully joining a new club via invite link.
	 * Handles NATS reconnection, subscription restart, and data reload.
	 * For first-time club joins (needsClub=true), also transitions app to live mode.
	 */
	async onClubJoined(clubUuid: string): Promise<void> {
		if (!browser) return;

		// If initialize() is still in flight (e.g. mid-way through connectAndLoad()),
		// wait for it to settle before we disconnect NATS. Without this, nats.disconnect()
		// can close the connection that connectAndLoad() is using to await data replies,
		// causing unpredictable errors or a silent early-return from the next nats.connect().
		if (this.initPromise) await this.initPromise.catch(() => {});

		const wasNeedsClub = this.needsClub;

		// Always populate liveModules before accessing them. Idempotent if already loaded.
		// Needed for the returning-member path when initialize() hasn't run yet (e.g. fast E2E clicks).
		await this.ensureLiveModules();

		// Fetch club-scoped token only; skip the blocking reloadAfterClubSwitch.
		await auth.switchClub(clubUuid, { reloadData: false });

		const { nats, subscriptionManager, dataLoader, clubService } = this.liveModules!;

		// Reconnect NATS with the new scoped token and restart subscriptions.
		await nats.disconnect();
		await nats.connect(auth.token as string);
		subscriptionManager.start(clubUuid);
		dataLoader.clearData();

		// Non-blocking: data loads in background; home page shows loading states.
		void Promise.all([
			clubService.loadClubInfo().catch((e: unknown) => {
				console.warn('[AppInit] Club info load failed after join:', e);
			}),
			dataLoader.loadInitialData().catch((e: unknown) => {
				console.warn('[AppInit] Initial data load failed after join:', e);
			})
		]);

		if (wasNeedsClub) {
			this.ensureReconnectRecovery();
			this.needsClub = false;
			this.setLiveReady();
		}
	}

	async initialize(opts?: { serverTicket?: string | null }): Promise<void> {
		if (!browser || this.status === 'ready') return;
		if (this.initPromise) return this.initPromise;

		this.initPromise = this.doInitialize(opts);
		try {
			await this.initPromise;
		} finally {
			if (this.initPromise) {
				this.initPromise = null;
			}
		}
	}

	private async doInitialize(opts?: { serverTicket?: string | null }): Promise<void> {
		this.status = 'initializing';
		this.error = null;

		try {
			await this.initializeByMode(opts);
		} catch (err) {
			this.handleInitializationError(err);
			console.error('[AppInit] Failed:', err);
		}
	}

	private async initializeByMode(opts?: { serverTicket?: string | null }): Promise<void> {
		if (this.isMockMode()) {
			await this.startMockMode();
			return;
		}

		const [{ initTracing }, { initMetrics }, { initLogs }] = await Promise.all([
			import('$lib/otel/tracing'),
			import('$lib/otel/metrics'),
			import('$lib/otel/logging')
		]);
		await Promise.all([initTracing(), initMetrics(), initLogs()]);
		const authResult = await this.authenticateAndLoadGuild(opts);
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

		// Load live-mode modules before any connection or reconnect-recovery setup.
		// This must happen even when switchedClubWithDataLoad skips connectAndLoad().
		await this.ensureLiveModules();

		if (!authResult.switchedClubWithDataLoad) {
			await this.connectAndLoad();
		}
		this.ensureReconnectRecovery();
		this.setLiveReady();
	}

	private async ensureLiveModules(): Promise<void> {
		if (this.liveModules) return;
		const [{ nats }, { subscriptionManager }, { dataLoader }, { clubService }] = await Promise.all([
			import('./nats.svelte'),
			import('./subscriptions.svelte'),
			import('./dataLoader.svelte'),
			import('./club.svelte')
		]);
		this.liveModules = { nats, subscriptionManager, dataLoader, clubService };
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
			activeClubEntitlements: {
				features: {
					betting: {
						key: 'betting',
						state: 'enabled',
						source: 'subscription'
					}
				}
			},
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

	private async authenticateAndLoadGuild(opts?: {
		serverTicket?: string | null;
	}): Promise<AuthInitializeResult> {
		// If a server-provided ticket is available and auth is already hydrated, skip the
		// redundant ticket fetch (saves one network round-trip on every page load).
		if (opts?.serverTicket && auth.isAuthenticated) {
			return { authenticated: true, switchedClubWithDataLoad: false };
		}

		// Initialize auth (extracts URL token or calls refreshSession)
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
		await this.ensureLiveModules();
		const { nats, subscriptionManager, dataLoader, clubService } = this.liveModules!;

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
		const clubLoadPromise = clubService.loadClubInfo().catch((e: unknown) => {
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
		if (this.reconnectUnsubscribe || !this.liveModules) return;

		const { nats, subscriptionManager, dataLoader } = this.liveModules;

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
			}, config.nats.reconnectReloadDelayMs);
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
		} else if (this.mode === 'live' && this.liveModules) {
			const { nats, subscriptionManager, clubService } = this.liveModules;

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
