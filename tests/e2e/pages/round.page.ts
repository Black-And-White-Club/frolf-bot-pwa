import type { Page, Locator } from '@playwright/test';

export class RoundPage {
	constructor(private page: Page) {}

	cards(): Locator {
		return this.page.locator('[data-testid^="dashboard-round-card-"]');
	}

	cardById(roundId: string): Locator {
		return this.page.getByTestId(`dashboard-round-card-${roundId}`);
	}
}
