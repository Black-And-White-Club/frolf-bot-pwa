import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors, leaderboardEntryByUser } from '../support/selectors';

type LeaderboardMode = 'tags' | 'points';

export class LeaderboardPage {
constructor(private page: Page) {}

rows(): Locator { return this.page.locator(selectors.leaderboardRow); }
rowByUser(userId: string): Locator { return this.page.locator(leaderboardEntryByUser(userId)); }

async expectLoaded(options: { minRows?: number } = {}): Promise<void> {
await expect(this.page.locator(selectors.leaderboardPanel)).toBeVisible();
if (options.minRows && options.minRows > 0) {
const count = await this.rows().count();
expect(count).toBeGreaterThanOrEqual(options.minRows);
}
}

async expectRowCount(count: number): Promise<void> {
await expect(this.rows()).toHaveCount(count);
}

async expectFirstUser(userId: string): Promise<void> {
await expect(this.rows().first()).toHaveAttribute('data-user-id', userId);
}

async expectRowContains(userId: string, value: string): Promise<void> {
await expect(this.rowByUser(userId)).toContainText(value);
}

async setMode(mode: LeaderboardMode): Promise<void> {
const label = mode === 'points' ? 'Points' : 'Tags';
const panel = this.page.locator(selectors.leaderboardPanel);
await panel.getByRole('tab', { name: label }).click();
await expect(panel.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true');
}
}
