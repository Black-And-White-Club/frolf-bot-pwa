import type { Page, Locator } from '@playwright/test';

import { selectors } from '../support/selectors';

export class AdminPage {
	constructor(private page: Page) {}

	root(): Locator {
		return this.page.locator('div.min-h-screen').filter({
			has: this.page.getByRole('heading', { name: 'Admin Dashboard', level: 1 })
		});
	}
	tagSection(): Locator {
		return this.page.locator('section').filter({
			has: this.page.getByRole('heading', { name: 'Tag Management' })
		});
	}
	pointSection(): Locator {
		return this.page.locator('section').filter({
			has: this.page.getByRole('heading', { name: 'Point Adjustment' })
		});
	}
	submitBatchButton(): Locator {
		return this.tagSection().getByRole('button', { name: 'Submit Batch' });
	}
	pointMemberSelect(): Locator {
		return this.page.locator(selectors.pointMemberSelect);
	}
	pointDeltaInput(): Locator {
		return this.page.locator(selectors.pointDeltaInput);
	}
	pointReasonInput(): Locator {
		return this.page.locator(selectors.pointReasonInput);
	}
	adjustPointsButton(): Locator {
		return this.pointSection().getByRole('button', { name: 'Adjust Points' });
	}

	async setTagForPlayer(displayName: string, newTag: string): Promise<void> {
		const row = this.tagSection().locator('tr').filter({ hasText: displayName });
		await row.locator('input[type="number"]').clear();
		await row.locator('input[type="number"]').fill(newTag);
	}
}
