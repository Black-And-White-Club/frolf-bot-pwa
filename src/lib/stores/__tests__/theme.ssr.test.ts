// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from 'vitest';

beforeEach(() => {
	// ensure fresh module load each test
	// other tests will reset modules as needed
});

describe('theme SSR behavior', () => {
	it('importing theme with no window/document is safe and initTheme is no-op', async () => {
		// Save originals
		const origWindow = (globalThis as unknown as { window?: unknown }).window;
		const origDocument = (globalThis as unknown as { document?: unknown }).document;

		try {
			// Temporarily remove window/document to simulate SSR
			Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true });
			Object.defineProperty(globalThis, 'document', { value: undefined, configurable: true });

			// Fresh import
			const mod = await import('../theme');
			const { initTheme, setGuildTheme, setCustomTheme, resetTheme, applyTheme, defaultTheme } =
				mod;

			// Calls should be safe no-ops or early-returns
			expect(() => initTheme()).not.toThrow();
			expect(() => setGuildTheme('guild_x')).not.toThrow();
			expect(() => setCustomTheme({ primary: '#111111' })).not.toThrow();
			expect(() => resetTheme()).not.toThrow();
			expect(() => applyTheme(defaultTheme)).not.toThrow();
		} finally {
			// restore
			Object.defineProperty(globalThis, 'window', { value: origWindow, configurable: true });
			Object.defineProperty(globalThis, 'document', { value: origDocument, configurable: true });
		}
	});
});
