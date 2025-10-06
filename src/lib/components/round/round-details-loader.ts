// Shared module-level cached dynamic import for RoundDetails
let detailsPromise: Promise<unknown> | null = null;

// Test hook used by unit tests to inject a fake dynamic import
export const __TEST_HOOKS: { injectedImport?: () => Promise<unknown>; clearCache?: () => void } =
	{};

// expose a small test helper so unit tests can reset the module-level cache between tests
__TEST_HOOKS.clearCache = () => {
	detailsPromise = null;
};

export function preloadRoundDetails(): Promise<unknown> {
	if (!detailsPromise) {
		detailsPromise = import('$lib/utils/preload-queue').then((m) =>
			m.enqueuePreload(() => {
				const importer = __TEST_HOOKS.injectedImport ?? (() => import('./RoundDetails.svelte'));
				return importer();
			})
		);
	}
	return detailsPromise;
}
