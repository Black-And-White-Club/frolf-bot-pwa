// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

// Fresh module imports are required because theme.ts holds module-scoped state
beforeEach(() => {
	vi.resetModules();
	// ensure a clean DOM & storage between tests
	if (typeof window !== 'undefined') {
		window.localStorage.clear();
		document.documentElement.className = '';
		document.documentElement.style.cssText = '';
	}
});

describe('theme integration tests', () => {
	it('applyTheme sets CSS variables and dark class', async () => {
		const mod = await import('../theme');
		const { applyTheme, defaultTheme, hexToRgbString } = mod;

		applyTheme(defaultTheme, true);

		expect(document.documentElement.style.getPropertyValue('--guild-primary')).toBe(
			defaultTheme.primary
		);
		expect(document.documentElement.classList.contains('dark')).toBe(true);

		// rgb alias should be set via setRgbAliases called by applyTheme
		expect(document.documentElement.style.getPropertyValue('--guild-primary-rgb')).toBe(
			hexToRgbString(defaultTheme.primary)
		);

		// dark fallbacks include rgba() style text variables
		expect(document.documentElement.style.getPropertyValue('--guild-text')).toContain('rgba(');
	});

	it('applyTheme clears dark class and sets light fallbacks when dark=false', async () => {
		const mod = await import('../theme');
		const { applyTheme, defaultTheme, hexToRgbString } = mod;

		// first apply dark then light
		applyTheme(defaultTheme, true);
		applyTheme(defaultTheme, false);

		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(document.documentElement.style.getPropertyValue('--guild-background')).toBe(
			defaultTheme.background
		);

		// check text-disabled uses --guild-text-rgb or hexToRgbString fallback
		const textDisabled = document.documentElement.style.getPropertyValue('--guild-text-disabled');
		expect(textDisabled).toContain('rgba(');
		expect(textDisabled).toContain(hexToRgbString(defaultTheme.text).split(',')[0].slice(1));
	});

	it('initTheme loads persisted theme and prefers_dark', async () => {
		// Prepare persisted storage
		const persisted = {
			primary: '#123456',
			secondary: '#654321',
			accent: '#abcdef',
			background: '#fafafa',
			surface: '#ffffff',
			text: '#222222',
			textSecondary: '#333333',
			border: '#444444'
		};
		window.localStorage.setItem('frolf:theme', JSON.stringify(persisted));
		window.localStorage.setItem('frolf:prefers_dark', '1');

		const mod = await import('../theme');
		const { initTheme, currentTheme, prefersDark } = mod;

		initTheme();

		// subscriptions run synchronously; read store
		expect(get(currentTheme).primary).toBe(persisted.primary);
		expect(get(prefersDark)).toBe(true);
		// document should have dark class because persisted preferred dark
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('setGuildTheme respects mock_ prefix and persists guild id', async () => {
		const mod = await import('../theme');
		const { setGuildTheme, currentTheme, defaultTheme } = mod;

		setGuildTheme('mock_abc');
		expect(get(currentTheme)).toEqual(defaultTheme);
		// mock_ prefixes intentionally do not persist a guild mapping
		expect(window.localStorage.getItem('frolf:guild_id')).toBeNull();
	});

	it('setGuildTheme selects a theme for a real guild id and persists it', async () => {
		const mod = await import('../theme');
		const { setGuildTheme, currentTheme } = mod;

		setGuildTheme('my_real_guild_42');
		const ct = get(currentTheme);
		// should be an object with a primary color string
		expect(typeof ct.primary).toBe('string');
		expect(window.localStorage.getItem('frolf:guild_id')).toBe('my_real_guild_42');
	});

	it('setCustomTheme merges partial and resetTheme restores default', async () => {
		const mod = await import('../theme');
		const { setCustomTheme, resetTheme, currentTheme, defaultTheme } = mod;

		setCustomTheme({ primary: '#abcdef' });
		expect(get(currentTheme).primary).toBe('#abcdef');

		resetTheme();
		expect(get(currentTheme)).toEqual(defaultTheme);
	});

	it('validateTheme returns errors for bad contrast and invalid hex', async () => {
		const mod = await import('../theme');
		const { validateTheme } = mod;

		// Construct a deliberately-broken theme
		const badTheme = JSON.parse(JSON.stringify((await import('../theme')).defaultTheme));
		badTheme.primary = 'not-a-hex';
		badTheme.text = '#000000';
		badTheme.background = '#000000';

		const res = validateTheme(badTheme);
		expect(res.isValid).toBe(false);
		expect(res.errors.length).toBeGreaterThanOrEqual(2);
		expect(res.errors.some((e) => e.includes('not a valid hex'))).toBe(true);
		expect(res.errors.some((e) => e.includes('insufficient contrast'))).toBe(true);
	});
});
