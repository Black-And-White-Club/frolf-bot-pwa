import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function expectDashboardLoaded(page: Page): Promise<void> {
	await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });
	await expect(page.getByTestId('dashboard-rounds-panel')).toBeVisible();
	await expect(page.getByTestId('dashboard-leaderboard-panel')).toBeVisible();
}

export async function expectLeaderboardLoaded(
	page: Page,
	options: { minRows?: number } = {}
): Promise<void> {
	await expect(page.getByTestId('dashboard-leaderboard-panel')).toBeVisible();
	if (options.minRows && options.minRows > 0) {
		const rows = page.locator('[data-testid^="leaderboard-row-"]');
		await expect.poll(async () => await rows.count()).toBeGreaterThanOrEqual(options.minRows);
	}
}
