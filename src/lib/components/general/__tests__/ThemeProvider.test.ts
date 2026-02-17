// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ThemeProvider from '../ThemeProvider.svelte';
import * as themeStore from '$lib/stores/theme';

describe('ThemeProvider', () => {
	it('calls initTheme on mount', () => {
		const initSpy = vi.spyOn(themeStore, 'initTheme').mockImplementation(() => {
			/* no-op */
		});

		const { getByTestId } = render(ThemeProvider, { props: { testid: 'tp-1' } });
		const el = getByTestId('tp-1');
		expect(el).toBeTruthy();

		expect(initSpy).toHaveBeenCalled();

		initSpy.mockRestore();
	});
});
