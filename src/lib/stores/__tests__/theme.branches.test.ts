/* @vitest-environment jsdom */
import { test, expect, beforeEach } from 'vitest';
import { applyTheme, defaultTheme, setGuildTheme, currentTheme } from '../theme';

beforeEach(() => {
	// reset document root between tests
	document.documentElement.className = '';
	document.documentElement.style.cssText = '';
	window.localStorage.clear();
});

test('applyTheme sets css variables and toggles dark class', () => {
	applyTheme(defaultTheme, false);
	expect(document.documentElement.getAttribute('data-guild-theme')).toBe(defaultTheme.primary);
	expect(document.documentElement.style.getPropertyValue('--guild-background')).toBe(
		defaultTheme.background
	);
	// dark toggle
	applyTheme(defaultTheme, true);
	expect(document.documentElement.classList.contains('dark')).toBe(true);
	expect(document.documentElement.style.getPropertyValue('--guild-background')).toBe('#0F0F0F');
});

test('setGuildTheme selects default for mock ids and persists guild id', () => {
	setGuildTheme('mock_local');
	// currentTheme should equal defaultTheme
	let val: unknown = null;
	currentTheme.subscribe((v) => (val = v))();
	expect(val).toEqual(defaultTheme);
	// mock_* ids intentionally do not persist
	expect(window.localStorage.getItem('frolf:guild_id')).toBeNull();
});

test('setGuildTheme persists non-mock guild ids', () => {
	setGuildTheme('guild_123');
	// persisted guild id should be stored
	expect(window.localStorage.getItem('frolf:guild_id')).toBe('guild_123');
});
