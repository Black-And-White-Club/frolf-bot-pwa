import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors } from '../support/selectors';

export class SigninPage {
constructor(private page: Page) {}

discordButton(): Locator { return this.page.getByRole('link', { name: 'Sign in with Discord' }); }
googleButton(): Locator { return this.page.getByRole('link', { name: 'Sign in with Google' }); }

async expectGuestSignInCta(): Promise<void> {
await expect(this.page.locator(selectors.signInButton)).toBeVisible();
await expect(this.page.locator(selectors.signInButton)).toContainText('Sign In');
}

async expectOAuthError(): Promise<void> {
await expect(this.page.getByText('Sign-in failed. Please try again.')).toBeVisible();
}

async expectOAuthOnlyUi(): Promise<void> {
await expect(this.page.locator('#email')).toHaveCount(0);
await expect(this.page.getByRole('button', { name: 'Send Magic Link' })).toHaveCount(0);
}
}
