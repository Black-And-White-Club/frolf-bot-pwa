import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { selectors } from '../support/selectors';

export class AccountPage {
	constructor(private page: Page) {}

	root(): Locator {
		return this.page.getByRole('heading', { name: 'Account', level: 1 });
	}
	connectedAccountsSection(): Locator {
		return this.page.locator('section').filter({
			has: this.page.getByRole('heading', { name: 'Connected Accounts' })
		});
	}
	inviteLinksSection(): Locator {
		return this.page.locator('section').filter({
			has: this.page.getByRole('heading', { name: 'Invite Links' })
		});
	}

	discordRow(): Locator {
		return this.connectedAccountsSection()
			.locator('div.flex.items-center.justify-between')
			.filter({ hasText: 'Discord' });
	}
	googleRow(): Locator {
		return this.connectedAccountsSection()
			.locator('div.flex.items-center.justify-between')
			.filter({ hasText: 'Google' });
	}

	createRoleSelect(): Locator {
		return this.page.locator(selectors.accountCreateRole);
	}
	createMaxUsesInput(): Locator {
		return this.page.locator(selectors.accountCreateMaxUses);
	}
	createExpiresInput(): Locator {
		return this.page.locator(selectors.accountCreateExpires);
	}
	createInviteButton(): Locator {
		return this.inviteLinksSection().getByRole('button', { name: /^Create$/ });
	}

	async clickRevoke(code: string): Promise<void> {
		const row = this.inviteLinksSection()
			.locator('div.flex.flex-wrap')
			.filter({ has: this.page.locator('code').filter({ hasText: code }) });
		await row.getByRole('button', { name: 'Revoke' }).click();
	}

	async expectInvitePresent(code: string): Promise<void> {
		await expect(this.inviteLinksSection().locator('code').filter({ hasText: code })).toBeVisible();
	}

	async expectInviteMissing(code: string): Promise<void> {
		await expect(this.inviteLinksSection().locator('code').filter({ hasText: code })).toHaveCount(
			0
		);
	}
}
