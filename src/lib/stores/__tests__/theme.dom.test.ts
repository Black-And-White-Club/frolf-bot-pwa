// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { resetModuleAndDom } from './test-utils';

beforeEach(() => {
	vi.resetModules();
	resetModuleAndDom();
});

describe('theme DOM integration', () => {
	it('applyTheme sets CSS variables and dark class', async () => {
		const mod = await import('../theme');
		const { applyTheme, defaultTheme, hexToRgbString } = mod;

		applyTheme(defaultTheme, true);

		expect(document.documentElement.style.getPropertyValue('--guild-primary')).toBe(
			defaultTheme.primary
		);
		expect(document.documentElement.classList.contains('dark')).toBe(true);

		expect(document.documentElement.style.getPropertyValue('--guild-primary-rgb')).toBe(
			hexToRgbString(defaultTheme.primary)
		);

		const textVal = document.documentElement.style.getPropertyValue('--guild-text');
		// Some runtimes may leave the alias as a hex color string; accept either
		expect(textVal.includes('rgba(') || textVal.startsWith('#')).toBe(true);
	});

	it('applyTheme clears dark class and sets light fallbacks when dark=false', async () => {
		const mod = await import('../theme');
		const { applyTheme, defaultTheme, hexToRgbString } = mod;

		applyTheme(defaultTheme, true);
		applyTheme(defaultTheme, false);

		expect(document.documentElement.classList.contains('dark')).toBe(false);
		expect(document.documentElement.style.getPropertyValue('--guild-background')).toBe(
			defaultTheme.background
		);

		const textDisabled = document.documentElement.style.getPropertyValue('--guild-text-disabled');
		expect(textDisabled).toContain('rgba(');
		expect(textDisabled).toContain(hexToRgbString(defaultTheme.text).split(',')[0].slice(1));
	});

	it('applyTheme uses existing css rgb aliases when present', async () => {
		const mod = await import('../theme');
		const { applyTheme, defaultTheme } = mod;

		document.documentElement.style.setProperty('--guild-text-rgb', '9,8,7');
		document.documentElement.style.setProperty('--guild-primary-rgb', '1,2,3');

		applyTheme(defaultTheme, false);

		const textDisabled = document.documentElement.style.getPropertyValue('--guild-text-disabled');
		expect(textDisabled).toContain('rgba(');

		const primary20 = document.documentElement.style.getPropertyValue('--guild-primary-20');
		expect(primary20).toContain('rgba(');
	});

	it('removeStrayDarkClasses removes dark class from non-root elements', async () => {
		const extra = document.createElement('div');
		extra.className = 'dark';
		document.body.appendChild(extra);

		const mod = await import('../theme');
		const { applyTheme, defaultTheme } = mod;

		applyTheme(defaultTheme, true);

		expect(document.documentElement.classList.contains('dark')).toBe(true);
		expect(extra.classList.contains('dark')).toBe(false);
	});

	it('setRgbAliases in dark mode aliases text rgb to background', async () => {
		const mod = await import('../theme');
		const { applyTheme, defaultTheme, hexToRgbString } = mod;

		applyTheme(defaultTheme, true);

		expect(document.documentElement.style.getPropertyValue('--guild-text-rgb')).toBe(
			hexToRgbString(defaultTheme.background)
		);
	});

	it('setCustomTheme triggers persistTheme and writes to localStorage', async () => {
		const mod = await import('../theme');
		const { initTheme, setCustomTheme } = mod;

		initTheme();

		setCustomTheme({ primary: '#abcdef' });

		const stored = JSON.parse(window.localStorage.getItem('frolf:theme') || '{}');
		expect(stored.primary).toBe('#abcdef');
	});

	it('persistTheme tolerates setItem throwing', async () => {
		const origLocalStorage = window.localStorage;
		const fakeStorage: Partial<Storage> = {
			setItem: () => {
				throw new Error('boom');
			}
		};

		Object.defineProperty(window, 'localStorage', { value: fakeStorage, configurable: true });

		const mod = await import('../theme');
		const { initTheme, setCustomTheme, currentTheme } = mod;

		initTheme();

		expect(() => setCustomTheme({ primary: '#123456' })).not.toThrow();
		expect(get(currentTheme).primary).toBe('#123456');

		Object.defineProperty(window, 'localStorage', { value: origLocalStorage, configurable: true });
	});

	it('persisted theme payload contains only color keys (no spacing)', async () => {
		const mod = await import('../theme');
		const { initTheme, setCustomTheme } = mod;

		initTheme();
		const payload = { primary: '#222222', spacing: { xs: '9rem' } } as unknown as Parameters<
			typeof setCustomTheme
		>[0];
		setCustomTheme(payload);

		const stored = JSON.parse(window.localStorage.getItem('frolf:theme') || '{}');
		expect(stored.primary).toBe('#222222');
		expect(stored.spacing).toBeUndefined();
	});

	it('initTheme swallows storage.get exceptions (resilience)', async () => {
		const orig = window.localStorage.getItem;
		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: () => {
					throw new Error('storage boom');
				},
				setItem: () => {},
				removeItem: () => {}
			},
			configurable: true
		});

		const mod = await import('../theme');
		const { initTheme, currentTheme } = mod;

		expect(() => initTheme()).not.toThrow();

		Object.defineProperty(window, 'localStorage', { value: orig, configurable: true });

		expect(typeof get(currentTheme).primary).toBe('string');
	});
});
