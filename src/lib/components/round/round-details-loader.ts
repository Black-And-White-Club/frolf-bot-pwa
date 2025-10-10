// Lightweight shim for round details loader. Provides preloadRoundDetails()
// and a __TEST_HOOKS API for tests that still expect to inject imports.

import RoundDetails from './RoundDetails.svelte';

type ImportResult = { default: any } | null;

let cachedPromise: Promise<ImportResult> | null = null;

export const __TEST_HOOKS: {
	injectedImport?: (() => Promise<ImportResult>) | undefined;
	clearCache?: () => void;
} = {};

export function preloadRoundDetails(): Promise<ImportResult> {
	if (cachedPromise) return cachedPromise;

	if (typeof __TEST_HOOKS.injectedImport === 'function') {
		cachedPromise = __TEST_HOOKS.injectedImport();
		return cachedPromise;
	}

	cachedPromise = Promise.resolve({ default: RoundDetails });
	return cachedPromise;
}

__TEST_HOOKS.clearCache = () => {
	cachedPromise = null;
};

export default {};
