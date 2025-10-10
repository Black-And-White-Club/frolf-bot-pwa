// Lightweight shim for participant loader. Previously this returned a dynamic
// import; runtime now imports the component statically but tests and older
// code may still import this module. Keep a minimal API compatible with
// earlier tests: preloadParticipantDisplay() and __TEST_HOOKS with
// injectedImport and clearCache.

import ParticipantDisplay from './ParticipantDisplay.svelte';

type ImportResult = { default: any } | null;

let cachedPromise: Promise<ImportResult> | null = null;

export const __TEST_HOOKS: {
	injectedImport?: (() => Promise<ImportResult>) | undefined;
	clearCache?: () => void;
} = {};

export function preloadParticipantDisplay(): Promise<ImportResult> {
	if (cachedPromise) return cachedPromise;

	if (typeof __TEST_HOOKS.injectedImport === 'function') {
		cachedPromise = __TEST_HOOKS.injectedImport();
		return cachedPromise;
	}

	// Default: return the statically imported component so callers get a
	// truthy module-like object with `default`.
	cachedPromise = Promise.resolve({ default: ParticipantDisplay });
	return cachedPromise;
}

__TEST_HOOKS.clearCache = () => {
	cachedPromise = null;
};

export default {};
