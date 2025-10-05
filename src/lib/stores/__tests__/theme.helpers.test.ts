/* @vitest-environment jsdom */
import { test, expect } from 'vitest';
import { hexToRgbString, setRgbAliases } from '$lib/stores/theme.helpers';
import { defaultTheme } from '$lib/stores/theme';

test('hexToRgbString basic conversions', () => {
	expect(hexToRgbString('#ff0000')).toBe('255, 0, 0');
	expect(hexToRgbString('#000000')).toBe('0, 0, 0');
	expect(hexToRgbString('invalid')).toBe('0, 0, 0');
});

test('setRgbAliases sets css variables on document', () => {
	// run against defaultTheme
	document.documentElement.style.cssText = '';
	setRgbAliases(defaultTheme);
	expect(document.documentElement.style.getPropertyValue('--guild-primary-rgb')).toBeDefined();
	expect(document.documentElement.style.getPropertyValue('--guild-mint-rgb')).toBeDefined();
});
