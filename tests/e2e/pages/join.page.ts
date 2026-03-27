import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors } from '../support/selectors';

export class JoinPage {
constructor(private page: Page) {}

codeInput(): Locator { return this.page.locator(selectors.joinCodeInput); }
lookupButton(): Locator { return this.page.getByRole('button', { name: 'Look up code' }); }
joinButton(): Locator { return this.page.locator('button').filter({ hasText: /^Join/ }); }

async expectPreviewClub(name: string): Promise<void> {
await expect(this.page.getByRole('heading', { name })).toBeVisible();
}

async expectInvalidInvite(message?: string): Promise<void> {
await expect(this.page.getByRole('heading', { name: 'Invalid Invite' })).toBeVisible();
if (message) {
await expect(this.page.getByText(message)).toBeVisible();
}
}
}
