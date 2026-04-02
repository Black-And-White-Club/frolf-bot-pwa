import type { Page, Locator } from '@playwright/test';

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
		return this.page.locator('#point-member');
	}
	pointDeltaInput(): Locator {
		return this.page.locator('#point-delta');
	}
	pointReasonInput(): Locator {
		return this.page.locator('#point-reason');
	}
	adjustPointsButton(): Locator {
		return this.pointSection().getByRole('button', { name: 'Adjust Points' });
	}

	udiscSection(): Locator {
		return this.page.locator('section').filter({
			has: this.page.getByRole('heading', { name: 'UDisc Identity Editor' })
		});
	}
	udiscUserSelect(): Locator {
		return this.page.locator('#udisc-user');
	}
	udiscManualIdInput(): Locator {
		return this.page.locator('#udisc-manual-id');
	}
	udiscUsernameInput(): Locator {
		return this.page.locator('#udisc-username');
	}
	udiscNameInput(): Locator {
		return this.page.locator('#udisc-name');
	}
	saveUDiscButton(): Locator {
		return this.udiscSection().getByRole('button', { name: 'Save UDisc Identity' });
	}

	republishSection(): Locator {
		return this.page.locator('section').filter({
			has: this.page.getByRole('heading', { name: 'Republish Round Embed' })
		});
	}
	republishRoundSelect(): Locator {
		return this.page.locator('#republish-round');
	}
	republishRoundIdInput(): Locator {
		return this.page.locator('#republish-round-id');
	}
	republishButton(): Locator {
		return this.republishSection().getByRole('button', { name: 'Republish Embed' });
	}
}
