import type { Page, Locator } from '@playwright/test';

export class DocsPage {
	constructor(private page: Page) {}

	sidebarNav(): Locator {
		return this.page.locator('nav[aria-label="Documentation navigation"]').first();
	}
	mobileNavToggle(): Locator {
		return this.page.locator('button[aria-controls="docs-mobile-nav"]');
	}
	mobileNav(): Locator {
		return this.page.locator('#docs-mobile-nav');
	}
}
