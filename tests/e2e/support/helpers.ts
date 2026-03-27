import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors } from './selectors';

export async function expectDashboardLoaded(page: Page): Promise<void> {
await expect(page.locator(selectors.dashboard)).toBeVisible({ timeout: 15000 });
await expect(page.locator(selectors.roundsPanel)).toBeVisible();
await expect(page.locator(selectors.leaderboardPanel)).toBeVisible();
}

export async function expectLeaderboardLoaded(
page: Page,
options: { minRows?: number } = {}
): Promise<void> {
await expect(page.locator(selectors.leaderboardPanel)).toBeVisible();
if (options.minRows && options.minRows > 0) {
const rows = page.locator(selectors.leaderboardRow);
const count = await rows.count();
expect(count).toBeGreaterThanOrEqual(options.minRows);
}
}
