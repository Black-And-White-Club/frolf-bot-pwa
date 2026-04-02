import type { Page, Locator } from '@playwright/test';

export class LeaderboardPage {
	constructor(private page: Page) {}

	rows(): Locator {
		return this.page.locator('[data-testid^="leaderboard-row-"]');
	}

	rowByUser(userId: string): Locator {
		return this.page.getByTestId(`leaderboard-row-${userId}`);
	}

	tabPoints(): Locator {
		return this.page.getByRole('tab', { name: 'Points' });
	}

	tabTags(): Locator {
		return this.page.getByRole('tab', { name: 'Tags' });
	}
}
