import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

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

	async isCompactLayout(): Promise<boolean> {
		return await this.mobileNavToggle().isVisible();
	}

	async clickNavItem(label: string): Promise<void> {
		const isCompact = await this.isCompactLayout();
		if (!isCompact) {
			await this.sidebarNav().getByRole('link', { name: label }).click();
			return;
		}
		await this.openMobileNav();
		await this.mobileNav().getByRole('link', { name: label }).click();
	}

	async openMobileNav(): Promise<void> {
		const toggle = this.mobileNavToggle();
		const expanded = await toggle.getAttribute('aria-expanded');
		if (expanded !== 'true') {
			await toggle.click();
		}
	}

	async expectHeading(text: string): Promise<void> {
		await expect(this.page.getByRole('heading', { name: text, level: 1 })).toBeVisible();
	}
}
