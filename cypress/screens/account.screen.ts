import { selectors } from '../support/selectors';

export const accountScreen = {
	root() {
		return cy.contains('h1', 'Account').closest('main');
	},
	connectedAccountsSection() {
		return cy.contains('h2', 'Connected Accounts').closest('section');
	},
	inviteLinksSection() {
		return cy.contains('h2', 'Invite Links').closest('section');
	},
	discordRow() {
		return this.connectedAccountsSection()
			.contains('span', 'Discord')
			.closest('div.flex.items-center.justify-between');
	},
	googleRow() {
		return this.connectedAccountsSection()
			.contains('span', 'Google')
			.closest('div.flex.items-center.justify-between');
	},
	createRoleSelect() {
		return cy.get(selectors.accountCreateRole);
	},
	createMaxUsesInput() {
		return cy.get(selectors.accountCreateMaxUses);
	},
	createExpiresInput() {
		return cy.get(selectors.accountCreateExpires);
	},
	createInviteButton() {
		return this.inviteLinksSection().contains('button', /^Create$/);
	},
	clickRevoke(code: string) {
		this.inviteLinksSection()
			.contains('code', code)
			.closest('div.flex.flex-wrap')
			.contains('button', 'Revoke')
			.click();
	},
	expectInvitePresent(code: string) {
		this.inviteLinksSection().contains('code', code).should('be.visible');
	},
	expectInviteMissing(code: string) {
		this.inviteLinksSection().contains('code', code).should('not.exist');
	}
} as const;
