import type { Page, Locator } from '@playwright/test';

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
		return this.page.locator('#create-role');
	}

	createMaxUsesInput(): Locator {
		return this.page.locator('#create-max-uses');
	}

	createExpiresInput(): Locator {
		return this.page.locator('#create-expires');
	}

	createInviteButton(): Locator {
		return this.inviteLinksSection().getByRole('button', { name: /^Create$/ });
	}

	inviteCode(code: string): Locator {
		return this.inviteLinksSection().locator('code').filter({ hasText: code });
	}

	revokeBtn(code: string): Locator {
		return this.inviteLinksSection()
			.locator('div.flex.flex-wrap')
			.filter({ has: this.page.locator('code').filter({ hasText: code }) })
			.getByRole('button', { name: 'Revoke' });
	}
}
