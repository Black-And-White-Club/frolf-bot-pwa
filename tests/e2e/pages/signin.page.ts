import type { Page, Locator } from '@playwright/test';

export class SigninPage {
	constructor(private page: Page) {}

	signInCtaBtn(): Locator {
		return this.page.getByTestId('signin-cta-btn');
	}

	discordBtn(): Locator {
		return this.page.getByTestId('signin-discord-btn');
	}

	googleBtn(): Locator {
		return this.page.getByTestId('signin-google-btn');
	}

	oauthError(): Locator {
		return this.page.getByTestId('signin-oauth-error');
	}
}
