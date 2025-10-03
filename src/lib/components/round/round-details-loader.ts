// Shared module-level cached dynamic import for RoundDetails
let detailsPromise: Promise<unknown> | null = null;

export const __TEST_HOOKS: { injectedImport?: (path: string) => Promise<unknown> } = {};

export function preloadRoundDetails(): Promise<unknown> {
    if (!detailsPromise) {
        detailsPromise = import('$lib/utils/preload-queue').then((m) =>
            m.enqueuePreload(() => (
                __TEST_HOOKS.injectedImport ? __TEST_HOOKS.injectedImport('./RoundDetails.svelte') : import('./RoundDetails.svelte')
            ))
        );
    }
    return detailsPromise;
}
