/* @vitest-environment jsdom */
import { render, fireEvent } from '@testing-library/svelte';
import { test, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import ThemeToggle from '../ThemeToggle.svelte';
import { prefersDark } from '$lib/stores/theme';

beforeEach(() => {
	// reset store before each test to keep tests isolated
	try {
		prefersDark.set(false);
	} catch {
		/* ignore */
	}
});

test('toggles prefersDark when clicked', async () => {
	const { getByTestId } = render(ThemeToggle, { props: { testid: 'theme-toggle' } });
	const btn = getByTestId('theme-toggle') as HTMLButtonElement;

	// initial value from store (default false) represented on the button via aria-pressed
	expect(btn.getAttribute('aria-pressed')).toBe('false');

	await fireEvent.click(btn);

	// button aria-pressed should update to true
	expect(btn.getAttribute('aria-pressed')).toBe('true');

	// underlying store should also reflect the change
	expect(get(prefersDark)).toBe(true);
});

test('toggles prefersDark when activated with Enter key', async () => {
	const { getByTestId } = render(ThemeToggle, { props: { testid: 'theme-toggle' } });
	const btn = getByTestId('theme-toggle') as HTMLButtonElement;

	// simulate Enter keydown
	await fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter', keyCode: 13 });

	expect(btn.getAttribute('aria-pressed')).toBe('true');
	expect(get(prefersDark)).toBe(true);
});

test('toggles prefersDark when activated with Space key', async () => {
	const { getByTestId } = render(ThemeToggle, { props: { testid: 'theme-toggle' } });
	const btn = getByTestId('theme-toggle') as HTMLButtonElement;

	// simulate Space keydown
	await fireEvent.keyDown(btn, { key: ' ', code: 'Space', keyCode: 32 });

	expect(btn.getAttribute('aria-pressed')).toBe('true');
	expect(get(prefersDark)).toBe(true);
});
