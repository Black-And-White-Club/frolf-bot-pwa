import { test, expect } from 'vitest';
import {
	hexToRgbString,
	validateTheme,
	defaultTheme,
	currentTheme,
	setCustomTheme,
	resetTheme
} from '../theme';
import type { GuildTheme } from '../theme';

test('hexToRgbString produces correct rgb string', () => {
	expect(hexToRgbString('#ff0000')).toBe('255, 0, 0');
	expect(hexToRgbString('#000000')).toBe('0, 0, 0');
});

test('validateTheme accepts default theme and rejects invalid hex', () => {
	const v = validateTheme(defaultTheme);
	expect(v.isValid).toBe(true);
	// invalid color
	const bad: GuildTheme = { ...defaultTheme, primary: '#zzz' };
	const v2 = validateTheme(bad);
	expect(v2.isValid).toBe(false);
	expect(v2.errors.length).toBeGreaterThan(0);
});

test('currentTheme setCustomTheme and resetTheme', () => {
	resetTheme();
	let cur: GuildTheme | undefined;
	currentTheme.subscribe((v) => (cur = v))();
	expect(cur!.primary).toBe(defaultTheme.primary);
	setCustomTheme({ primary: '#123456' } as Partial<GuildTheme>);
	currentTheme.subscribe((v) => (cur = v))();
	expect(cur!.primary).toBe('#123456');
	resetTheme();
	currentTheme.subscribe((v) => (cur = v))();
	expect(cur!.primary).toBe(defaultTheme.primary);
});
