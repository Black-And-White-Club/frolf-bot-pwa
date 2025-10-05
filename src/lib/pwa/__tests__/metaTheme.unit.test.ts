// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { updateMetaThemeColor } from '$lib/pwa/metaTheme';

describe('metaTheme utilities', () => {
	it('creates no-op when no meta present (returns null)', () => {
		document.head.innerHTML = '';
		const res = updateMetaThemeColor();
		// returns null because no meta tag exists
		expect(res).toBeNull();
	});

	it('updates existing meta tag content', () => {
		document.head.innerHTML = `<meta name="theme-color" content="#000">`;
		// set a CSS variable used by the function
		document.documentElement.style.setProperty('--guild-primary', '#abcdef');
		const res = updateMetaThemeColor();
		expect(res).toBe('#abcdef');
		const meta = document.querySelector('meta[name="theme-color"]');
		expect(meta).toBeTruthy();
		expect(meta!.getAttribute('content')).toBe('#abcdef');
	});
});
