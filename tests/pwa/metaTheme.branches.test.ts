// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { updateMetaThemeColor } from '$lib/pwa/metaTheme';

describe('metaTheme additional branches', () => {
	// Ensure tests don't leak CSS variable or class state between each other
	beforeEach(() => {
		document.head.innerHTML = '';
		document.documentElement.style.removeProperty('--guild-primary-rgb');
		document.documentElement.style.removeProperty('--guild-primary');
		document.documentElement.classList.remove('dark');
	});
	it('uses RGB token when present', () => {
		document.head.innerHTML = '<meta name="theme-color" content="#000">';
		document.documentElement.style.setProperty('--guild-primary-rgb', '0 116 116');
		const res = updateMetaThemeColor();
		expect(res).not.toBeNull();
		expect(typeof res).toBe('string');
		const s = res as string;
		expect(s.startsWith('rgb(')).toBe(true);
		expect(s).toContain('0 116 116');
		const meta = document.querySelector('meta[name="theme-color"]')!;
		expect(meta.getAttribute('content')).toContain('0 116 116');
	});

	it('fallbacks to dark color when no tokens and document is dark', () => {
		document.head.innerHTML = '<meta name="theme-color" content="#000">';
		document.documentElement.classList.add('dark');
		const res = updateMetaThemeColor();
		expect(res).toBe('#0f0f0f');
		const meta = document.querySelector('meta[name="theme-color"]')!;
		expect(meta.getAttribute('content')).toBe('#0f0f0f');
	});

	it('fallbacks to light color when no tokens and not dark', () => {
		document.head.innerHTML = '<meta name="theme-color" content="#000">';
		document.documentElement.classList.remove('dark');
		const res = updateMetaThemeColor();
		expect(res).toBe('#007474');
		const meta = document.querySelector('meta[name="theme-color"]')!;
		expect(meta.getAttribute('content')).toBe('#007474');
	});

	it('converts 3-digit hex to rgb', () => {
		document.head.innerHTML = '<meta name="theme-color" content="#000">';
		document.documentElement.style.setProperty('--guild-primary', '#abc');
		const res = updateMetaThemeColor();
		expect(res).not.toBeNull();
		expect(typeof res).toBe('string');
		const s = res as string;
		expect(s.startsWith('rgb(')).toBe(true);
		// check that one of the expanded values appears (a -> aa -> 170)
		expect(s).toContain('170');
	});
});
