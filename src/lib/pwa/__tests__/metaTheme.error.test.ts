/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { updateMetaThemeColor } from '$lib/pwa/metaTheme';

describe('metaTheme error handling', () => {
	it('returns null when getComputedStyle throws', () => {
		document.head.innerHTML = `<meta name="theme-color" content="#000">`;
		const orig = globalThis.getComputedStyle;
		type GS = { getComputedStyle?: (...args: unknown[]) => unknown };
		(globalThis as unknown as GS).getComputedStyle = () => {
			throw new Error('boom');
		};
		const res = updateMetaThemeColor();
		expect(res).toBeNull();
		// restore
		globalThis.getComputedStyle = orig;
	});
});
