/**
 * App Initializer
 * Orchestrates startup sequence: OTel -> Auth -> NATS -> Subscriptions
 */

import { auth } from './auth.svelte';
import { nats } from './nats.svelte';
import { subscriptionManager } from './subscriptions.svelte';
import { initTracing } from '$lib/otel/tracing';

type InitStatus = 'idle' | 'initializing' | 'ready' | 'error';

class AppInitializer {
	status = $state<InitStatus>('idle');
	error = $state<string | null>(null);

	isReady = $derived(this.status === 'ready');
	isLoading = $derived(this.status === 'initializing');

	async initialize(): Promise<void> {
		if (this.status === 'initializing' || this.status === 'ready') {
			return;
		}

		this.status = 'initializing';
		this.error = null;

		try {
			// Step 1: Initialize tracing
			initTracing();

			// Step 2: Initialize auth (extracts token, validates)
			auth.initialize();

			// Step 3: Check if authenticated
			if (!auth.isAuthenticated || !auth.token) {
				// Not authenticated - that's OK, just mark ready
				// UI will show login prompt
				this.status = 'ready';
				return;
			}

			// Step 4: Connect to NATS
			await nats.connect(auth.token);

			// Step 5: Start subscriptions for user's guild
			if (auth.user?.guildId) {
				subscriptionManager.start(auth.user.guildId);
			}

			this.status = 'ready';
		} catch (err) {
			this.status = 'error';
			this.error = err instanceof Error ? err.message : 'Initialization failed';
			console.error('[AppInit] Failed:', err);
		}
	}

	async teardown(): Promise<void> {
		// Stop subscriptions
		subscriptionManager.stop();

		// Disconnect NATS
		nats.destroy();

		// Clear auth
		auth.signOut();

		this.status = 'idle';
		this.error = null;
	}
}

export const appInit = new AppInitializer();
