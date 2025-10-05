/* @vitest-environment jsdom */
import { test, expect } from 'vitest';
import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '../unsplash';

test('isUnsplashUrl detects images.unsplash.com', () => {
	expect(isUnsplashUrl('https://images.unsplash.com/photo-123')).toBe(true);
	expect(isUnsplashUrl('https://example.com/a.png')).toBe(false);
});

test('unsplashSrcset builds entries with auto=format and widths', () => {
	const u = 'https://images.unsplash.com/photo-1';
	const s = unsplashSrcset(u, [48, 100]);
	expect(s).toContain('w=48');
	expect(s).toContain('w=100');
	expect(s).toContain('auto=format');
});

test('unsplashSizes returns px string', () => {
	expect(unsplashSizes(24)).toBe('24px');
});
