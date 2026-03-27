import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors } from '../support/selectors';

export class NavPage {
constructor(private page: Page) {}

navbar(): Locator { return this.page.locator(selectors.navbar); }

async isCompactLayout(): Promise<boolean> {
return await this.page.locator(selectors.hamburgerOpenButton).isVisible();
}

async withPrimaryNavigation(assertions: () => Promise<void>): Promise<void> {
const isCompact = await this.isCompactLayout();
if (!isCompact) {
await assertions();
return;
}
await this.openHamburger();
await expect(this.hamburgerDialog()).toBeVisible();
await assertions();
await this.closeHamburger();
await expect(this.hamburgerDialog()).toHaveCount(0);
}

async expectLinkVisible(label: string, href: string): Promise<void> {
await this.withPrimaryNavigation(async () => {
const link = this.page.getByRole('link', { name: label });
await expect(link).toBeVisible();
await expect(link).toHaveAttribute('href', href);
});
}

async expectAdminLinkVisible(): Promise<void> {
await this.expectLinkVisible('Admin', '/admin');
}

async expectAdminLinkMissing(): Promise<void> {
await this.withPrimaryNavigation(async () => {
await expect(this.page.locator('a[href="/admin"]')).toHaveCount(0);
});
}

async openHamburger(): Promise<void> {
await this.page.locator(selectors.hamburgerOpenButton).click();
}

hamburgerDialog(): Locator { return this.page.locator(selectors.hamburgerDialog); }

async closeHamburger(): Promise<void> {
await this.page.locator(selectors.hamburgerCloseButton).click();
}

async expectSignOutControlVisible(): Promise<void> {
const isCompact = await this.isCompactLayout();
if (!isCompact) {
await expect(this.page.locator(selectors.navbarSignOutButton)).toBeVisible();
return;
}
await this.openHamburger();
await expect(
this.hamburgerDialog().locator(selectors.hamburgerSignOutButton)
).toBeVisible();
await this.closeHamburger();
}
}
