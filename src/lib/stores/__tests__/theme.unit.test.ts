/* @vitest-environment jsdom */
import { test, expect, beforeEach } from 'vitest';
import { resetModuleAndDom } from './test-utils';

beforeEach(() => {
	// ensure fresh modules and clean DOM/storage
	// caller tests that need vi.resetModules should still call it explicitly
	resetModuleAndDom();
});

test('hexToRgbString produces correct rgb string', async () => {
	const mod = await import('../theme');
	const { hexToRgbString } = mod;

	expect(hexToRgbString('#ff0000')).toBe('255, 0, 0');
	expect(hexToRgbString('#000000')).toBe('0, 0, 0');
});

test('hexToRgbString basic conversions and invalid', async () => {
	const mod = await import('../theme');
	const { hexToRgbString } = mod;

	expect(hexToRgbString('#ff0000')).toBe('255, 0, 0');
	expect(hexToRgbString('#000000')).toBe('0, 0, 0');
	expect(hexToRgbString('invalid')).toBe('0, 0, 0');
});

test('validateTheme accepts default theme and rejects invalid hex', async () => {
	const mod = await import('../theme');
	const { validateTheme, defaultTheme } = mod;

	const v = validateTheme(defaultTheme);
	expect(v.isValid).toBe(true);

	// invalid color
	const bad = { ...defaultTheme, primary: '#zzz' } as typeof defaultTheme;
	const v2 = validateTheme(bad);
	expect(v2.isValid).toBe(false);
	expect(v2.errors.length).toBeGreaterThan(0);
});

test('setCustomTheme, resetTheme and currentTheme store', async () => {
	// This test mirrors the original integration style but stays synchronous
	const mod = await import('../theme');
	const { currentTheme, setCustomTheme, resetTheme, defaultTheme } = mod;

	resetTheme();
	let cur: typeof defaultTheme | undefined;
	const unsub = currentTheme.subscribe((v) => (cur = v));
	unsub();

	expect(cur!.primary).toBe(defaultTheme.primary);

	setCustomTheme({ primary: '#123456' } as Partial<typeof defaultTheme>);
	const unsub2 = currentTheme.subscribe((v) => (cur = v));
	unsub2();
	expect(cur!.primary).toBe('#123456');

	resetTheme();
	const unsub3 = currentTheme.subscribe((v) => (cur = v));
	unsub3();
	expect(cur!.primary).toBe(defaultTheme.primary);
});
