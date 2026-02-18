// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import HamburgerMenu from '../HamburgerMenu.svelte';

// Mock $app/state
vi.mock('$app/state', () => ({
	page: {
		data: { session: { user: { name: 'Test User' } } }
	}
}));

// Mock stores
vi.mock('$lib/stores/overlay', () => ({
	setModalOpen: vi.fn()
}));

// Mock ThemeToggle
vi.mock('../ThemeToggle.svelte', () => ({ default: () => {} }));

describe('HamburgerMenu', () => {
	it('renders Account nav link', () => {
		const { getByRole } = render(HamburgerMenu, {
			props: { closeHamburger: vi.fn() }
		});

		const accountLink = getByRole('link', { name: 'Account' });
		expect(accountLink).toBeTruthy();
		expect(accountLink.getAttribute('href')).toBe('/account');
	});

	it('calls closeHamburger when Account link is clicked', async () => {
		const closeHamburger = vi.fn();
		const { getByRole } = render(HamburgerMenu, {
			props: { closeHamburger }
		});

		const accountLink = getByRole('link', { name: 'Account' });
		await fireEvent.click(accountLink);

		expect(closeHamburger).toHaveBeenCalled();
	});
});
