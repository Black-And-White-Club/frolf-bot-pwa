// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { resetModuleAndDom } from './test-utils';

beforeEach(() => {
	vi.resetModules();
	resetModuleAndDom();
});

describe('theme system and guild behavior', () => {
	it('registers addEventListener on matchMedia when available', async () => {
		const addEventListener = vi.fn();
		const fakeMql = { matches: false, addEventListener } as unknown as MediaQueryList;
		Object.defineProperty(window, 'matchMedia', {
			value: () => fakeMql,
			configurable: true
		});

		const mod = await import('../theme');
		const { initTheme } = mod;

		initTheme();

		expect(addEventListener).toHaveBeenCalled();
		const [[firstArg]] = addEventListener.mock.calls;
		expect(firstArg).toBe('change');
	});

	it('change handler updates prefersDark when no persistent preference', async () => {
		let savedHandler: ((e: MediaQueryListEvent) => void) | undefined;
		const fakeMql = {
			matches: false,
			addEventListener: (_event: string, h: (e: MediaQueryListEvent) => void) => {
				savedHandler = h;
			}
		} as unknown as MediaQueryList;

		Object.defineProperty(window, 'matchMedia', {
			value: () => fakeMql,
			configurable: true
		});

		const mod = await import('../theme');
		const { initTheme, prefersDark } = mod;

		expect(window.localStorage.getItem('frolf:prefers_dark')).toBeNull();

		initTheme();

		window.localStorage.removeItem('frolf:prefers_dark');

		expect(typeof savedHandler).toBe('function');
		savedHandler?.({ matches: true } as MediaQueryListEvent);

		expect(get(prefersDark)).toBe(true);
	});

	it('setGuildTheme with mock id uses default and does not persist guild id', async () => {
		const mod = await import('../theme');
		const { setGuildTheme, currentTheme, defaultTheme } = mod;

		setGuildTheme('mock_foobar');

		expect(get(currentTheme).primary).toBe(defaultTheme.primary);
		expect(window.localStorage.getItem('frolf:guild_id')).toBeNull();
	});

	it('setGuildTheme with real id selects a theme deterministically and persists id', async () => {
		const mod = await import('../theme');
		const { setGuildTheme, currentTheme, guildThemes, defaultTheme } = mod;

		const guildId = 'guild_12345';
		setGuildTheme(guildId);

		expect(window.localStorage.getItem('frolf:guild_id')).toBe(guildId);

		const themeKeys = Object.keys(guildThemes).filter((k) => k !== 'default');
		const hash = guildId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const themeIndex = hash % themeKeys.length;
		const selectedTheme = guildThemes[themeKeys[themeIndex]] || defaultTheme;

		expect(get(currentTheme).primary).toBe(selectedTheme.primary);
	});
});
