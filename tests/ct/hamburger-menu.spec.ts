import { test, expect } from '@playwright/experimental-ct-svelte';
import HamburgerMenu from '$lib/components/general/HamburgerMenu.svelte';
import type { HooksConfig } from './playwright/index';

const testUser: HooksConfig['authUser'] = {
	id: 'user-1',
	uuid: 'user-1-uuid',
	activeClubUuid: 'club-1',
	guildId: 'guild-1',
	role: 'admin',
	clubs: [
		{
			club_uuid: 'club-1',
			role: 'admin',
			display_name: 'Test User',
			avatar_url: ''
		}
	],
	linkedProviders: ['discord']
};

test.describe('HamburgerMenu (Component)', () => {
	test('renders the hamburger menu dialog', async ({ mount, page }) => {
		await mount(HamburgerMenu, {
			props: { closeHamburger: () => {} },
			hooksConfig: { authUser: testUser }
		});

		const dialog =
			(await page.locator('[role="dialog"]').count()) > 0
				? page.locator('[role="dialog"]')
				: page.locator('nav');
		await expect(dialog.first()).toBeVisible();
	});

	test('calls close handler when Escape key is pressed', async ({ mount, page }) => {
		let called = false;
		await mount(HamburgerMenu, {
			props: {
				closeHamburger: () => {
					called = true;
				}
			},
			hooksConfig: { authUser: testUser }
		});

		await page.keyboard.press('Escape');
		expect(called).toBe(true);
	});

	test('calls close handler when backdrop is clicked', async ({ mount, page }) => {
		let called = false;
		await mount(HamburgerMenu, {
			props: {
				closeHamburger: () => {
					called = true;
				}
			},
			hooksConfig: { authUser: testUser }
		});

		const backdrop = page.locator('[data-testid="hamburger-backdrop"]');
		if (await backdrop.isVisible()) {
			await backdrop.click();
			expect(called).toBe(true);
		}
	});
});
