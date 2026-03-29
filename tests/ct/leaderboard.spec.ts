import { test, expect } from '@playwright/experimental-ct-svelte';
import Leaderboard from '$lib/components/leaderboard/Leaderboard.svelte';
import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';

const entries: LeaderboardEntry[] = Array.from({ length: 7 }, (_, index) => ({
	userId: `user-${index + 1}`,
	tagNumber: index + 1,
	totalPoints: 300 - index * 10,
	roundsPlayed: 5 + index,
	displayName: `Player ${index + 1}`
}));

test.describe('Leaderboard (Component)', () => {
	test('runs view-all callback and collapses rows', async ({ mount, page }) => {
		let viewAllCalled = false;
		await mount(Leaderboard, {
			props: {
				entries,
				limit: 2,
				onViewAll: () => {
					viewAllCalled = true;
				},
				testid: 'ct-leaderboard'
			}
		});

		await expect(page.locator('[data-testid^="leaderboard-row-"]')).toHaveCount(2);

		const viewAllBtn = page.locator('[data-testid="leaderboard-view-all"]');
		if (await viewAllBtn.isVisible()) {
			await viewAllBtn.click();
			expect(viewAllCalled).toBe(true);
		}
	});

	test('uses mobile default limits when mobile mode is active', async ({ mount, page }) => {
		await mount(Leaderboard, {
			props: {
				entries,
				onViewAll: () => {},
				testid: 'ct-leaderboard'
			},
			hooksConfig: { isMobile: true }
		});

		// Mobile default limit is 5
		await expect(page.locator('[data-testid^="leaderboard-row-"]')).toHaveCount(5);
	});

	test('shows full list without view-all when desktop has fewer than 10 entries', async ({
		mount,
		page
	}) => {
		await mount(Leaderboard, {
			props: {
				entries,
				onViewAll: () => {},
				testid: 'ct-leaderboard'
			}
			// isMobile defaults to false via beforeMount reset
		});

		await expect(page.locator('[data-testid^="leaderboard-row-"]')).toHaveCount(7);
		await expect(page.locator('[data-testid="leaderboard-view-all"]')).toHaveCount(0);
	});
});
