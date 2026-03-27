import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class LegalPage {
constructor(private page: Page) {}

async expectPrivacyPage(): Promise<void> {
await expect(this.page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible();
}
async expectTosPage(): Promise<void> {
await expect(this.page.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeVisible();
}
async expectLegalFooterLinks(): Promise<void> {
await expect(this.page.locator('footer').getByRole('link', { name: 'Home' })).toBeVisible();
await expect(this.page.locator('footer').getByRole('link', { name: 'Docs' })).toBeVisible();
}
}
