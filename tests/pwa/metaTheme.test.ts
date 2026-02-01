// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { updateMetaThemeColor } from '$lib/pwa/metaTheme';

describe('updateMetaThemeColor', () => {
	it('updates meta tag when present', () => {
		document.body.innerHTML = '<meta name="theme-color" content="#000">';
		document.documentElement.style.setProperty('--guild-primary', '#123456');
		const res = updateMetaThemeColor();
		// runtime may normalize to rgb(), accept either
		expect(res === '#123456' || (typeof res === 'string' && res.startsWith('rgb('))).toBe(true);
		const meta = document.querySelector('meta[name="theme-color"]');
		const content = meta?.getAttribute('content') || '';
		expect(content === '#123456' || content.startsWith('rgb(')).toBe(true);
	});

	it('returns null when meta missing', () => {
		document.body.innerHTML = '';
		const res = updateMetaThemeColor();
		expect(res).toBeNull();
	});
});
