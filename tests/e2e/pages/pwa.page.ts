import type { Page, Locator } from '@playwright/test';

export class PwaPage {
	constructor(private page: Page) {}

	offlineBanner(): Locator {
		return this.page.getByTestId('pwa-offline-banner');
	}

	installPrompt(): Locator {
		return this.page.getByTestId('pwa-install-prompt');
	}

	installPromptDismissBtn(): Locator {
		return this.page.getByTestId('pwa-install-prompt-dismiss-btn');
	}

	installPromptInstallBtn(): Locator {
		return this.page.getByTestId('pwa-install-prompt-install-btn');
	}
}
