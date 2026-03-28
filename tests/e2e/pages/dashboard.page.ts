import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors } from '../support/selectors';

export class DashboardPage {
	constructor(private page: Page) {}

	root(): Locator {
		return this.page.locator(selectors.dashboard);
	}
	roundsPanel(): Locator {
		return this.page.locator(selectors.roundsPanel);
	}
	leaderboardPanel(): Locator {
		return this.page.locator(selectors.leaderboardPanel);
	}
	loadingSkeleton(): Locator {
		return this.page.locator(selectors.loadingSkeleton);
	}
	roundCards(): Locator {
		return this.page.locator(selectors.roundCard);
	}

	async expectLoaded(): Promise<void> {
		await expect(this.root()).toBeVisible({ timeout: 15000 });
		await expect(this.roundsPanel()).toBeVisible();
		await expect(this.leaderboardPanel()).toBeVisible();
	}

	async expectRoundCountAtLeast(minCount: number): Promise<void> {
		const count = await this.roundCards().count();
		expect(count).toBeGreaterThanOrEqual(minCount);
	}

	async expectContainsText(text: string): Promise<void> {
		await expect(this.root()).toContainText(text);
	}
}
