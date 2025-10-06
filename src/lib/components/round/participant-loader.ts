// Shared module-level cached dynamic import for ParticipantDisplay
let participantPromise: Promise<unknown> | null = null;

// Test hook used by unit tests to inject a fake dynamic import
export const __TEST_HOOKS: { injectedImport?: () => Promise<unknown>; clearCache?: () => void } =
	{};

// expose a small test helper so unit tests can reset the module-level cache between tests
__TEST_HOOKS.clearCache = () => {
	participantPromise = null;
};

export function preloadParticipantDisplay(): Promise<unknown> {
	if (!participantPromise) {
		participantPromise = import('$lib/utils/preload-queue').then((m) =>
			m.enqueuePreload(() => {
				const importer =
					__TEST_HOOKS.injectedImport ?? (() => import('./ParticipantDisplay.svelte'));
				return importer();
			})
		);
	}
	return participantPromise;
}
