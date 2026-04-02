import type { Page, Locator } from '@playwright/test';

export class NavPage {
	constructor(private page: Page) {}

	navbar(): Locator {
		return this.page.getByTestId('nav-bar');
	}

	hamburgerOpenBtn(): Locator {
		return this.page.getByTestId('nav-hamburger-open');
	}

	hamburgerDialog(): Locator {
		return this.page.getByTestId('nav-hamburger-dialog');
	}

	hamburgerCloseBtn(): Locator {
		return this.page.getByTestId('nav-hamburger-close');
	}

	signOutBtn(): Locator {
		return this.page.getByTestId('nav-signout-btn');
	}

	hamburgerSignOutBtn(): Locator {
		return this.page.getByTestId('nav-hamburger-signout-btn');
	}

	skipLink(): Locator {
		return this.page.getByTestId('nav-skip-link');
	}
}
