/* @vitest-environment jsdom */
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

beforeEach(() => {
	// Ensure fresh module state for each test so module-level initialization runs with our mocks
	vi.resetModules();
});

afterEach(() => {
	vi.restoreAllMocks();
	// clean storage between tests
	try {
		window.localStorage.clear();
	} catch (e) {
		// ignore platform storage errors in test harness
		void e;
	}
});

test('initTheme is resilient to malformed JSON in persisted theme', async () => {
	// Put malformed JSON into storage
	window.localStorage.setItem('frolf:theme', 'this is not json');

	const themeMod = await import('../theme');

	// Should not throw and should leave currentTheme as default
	themeMod.initTheme();

	const cur = get(themeMod.currentTheme);
	expect(cur).toBeTruthy();
	// primary should equal the default primary
	expect(cur.primary).toEqual(themeMod.defaultTheme.primary);
});

test('stored prefers_dark overrides system matchMedia', async () => {
	// Simulate stored preference of dark
	window.localStorage.setItem('frolf:prefers_dark', '1');

	// Simulate system prefers-color-scheme: dark = false
	const originalMatchMedia = window.matchMedia;
	// Provide a minimal matchMedia stub
	// build a minimal typed stub matching MediaQueryList interface
	const stubMatchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false
	})) as unknown as typeof window.matchMedia;
	window.matchMedia = stubMatchMedia;

	const themeMod = await import('../theme');
	themeMod.initTheme();

	const pref = get(themeMod.prefersDark);
	expect(pref).toBe(true);

	// restore original
	window.matchMedia = originalMatchMedia;
});
