import type { Page, Locator } from '@playwright/test';

export class CreateRoundPage {
	constructor(private page: Page) {}

	createRouteBtn(): Locator {
		return this.page.getByTestId('rounds-create-btn');
	}

	createPage(): Locator {
		return this.page.getByTestId('create-round-page');
	}

	form(): Locator {
		return this.page.getByTestId('create-round-form');
	}

	titleInput(): Locator {
		return this.page.getByTestId('create-round-form-title-input');
	}

	descriptionInput(): Locator {
		return this.page.getByTestId('create-round-form-description-input');
	}

	startTimeInput(): Locator {
		return this.page.getByTestId('create-round-form-start-time-input');
	}

	timezoneInput(): Locator {
		return this.page.getByTestId('create-round-form-timezone-input');
	}

	locationInput(): Locator {
		return this.page.getByTestId('create-round-form-location-input');
	}

	submitBtn(): Locator {
		return this.page.getByTestId('create-round-form-submit-btn');
	}

	cancelLink(): Locator {
		return this.page.getByTestId('create-round-form-cancel-link');
	}

	requestedBanner(): Locator {
		return this.page.getByTestId('rounds-create-requested-banner');
	}
}
