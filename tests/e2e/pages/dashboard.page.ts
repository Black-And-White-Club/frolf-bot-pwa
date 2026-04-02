import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
	constructor(private page: Page) {}

	root(): Locator {
		return this.page.getByTestId('dashboard');
	}

	roundsPanel(): Locator {
		return this.page.getByTestId('dashboard-rounds-panel');
	}

	leaderboardPanel(): Locator {
		return this.page.getByTestId('dashboard-leaderboard-panel');
	}

	roundCard(roundId: string): Locator {
		return this.page.getByTestId(`dashboard-round-card-${roundId}`);
	}

	roundCards(): Locator {
		return this.page.locator('[data-testid^="dashboard-round-card-"]');
	}

	loadingSkeleton(): Locator {
		return this.page.getByTestId('loading-skeleton');
	}
}
