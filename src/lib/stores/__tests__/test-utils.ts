// Lightweight test helper used by store tests. If you have a central test helper
// in tests/helpers, prefer importing from there — this file bridges imports used
// inside the src/ tree to the tests helpers.
export function resetModuleAndDom() {
	// naive reset for svelte store tests: clear document body and reload modules if necessary.
	try {
		if (typeof document !== 'undefined') document.body.innerHTML = '';
	} catch {
		// ignore errors during DOM cleanup in test environment
	}
}
