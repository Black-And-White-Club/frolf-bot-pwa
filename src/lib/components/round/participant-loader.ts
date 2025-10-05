// Shared module-level cached dynamic import for ParticipantDisplay
let participantPromise: Promise<unknown> | null = null;

// Test-only injection: tests can set this to override the dynamic import behavior
// Example in tests: import { __TEST_injectedImport } from './participant-loader';
// Export a mutable hooks object so tests can set/clear hooks without linter complaints
export const __TEST_HOOKS: { injectedImport?: (path: string) => Promise<unknown> } = {};

export function preloadParticipantDisplay(): Promise<unknown> {
	if (!participantPromise) {
		// use the global preload queue to avoid many simultaneous imports
		participantPromise = import('$lib/utils/preload-queue').then((m) =>
			m.enqueuePreload(() =>
				__TEST_HOOKS.injectedImport
					? __TEST_HOOKS.injectedImport('./ParticipantDisplay.svelte')
					: import('./ParticipantDisplay.svelte')
			)
		);
	}
	return participantPromise;
}
