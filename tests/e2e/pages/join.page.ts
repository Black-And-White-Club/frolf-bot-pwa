import type { Page, Locator } from '@playwright/test';

export class JoinPage {
	constructor(private page: Page) {}

	codeInput(): Locator {
		return this.page.locator('input[name="code"]');
	}
	lookupButton(): Locator {
		return this.page.getByRole('button', { name: 'Look up code' });
	}
	joinButton(): Locator {
		return this.page.locator('button').filter({ hasText: /^Join/ });
	}
}
