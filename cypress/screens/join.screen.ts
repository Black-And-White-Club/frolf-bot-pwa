import { selectors } from '../support/selectors';

export const joinScreen = {
	root() {
		return cy.contains('h2', 'Join a Club').closest('div.w-full');
	},
	codeInput() {
		return cy.get(selectors.joinCodeInput);
	},
	lookupButton() {
		return cy.contains('button', 'Look up code');
	},
	joinButton() {
		return cy.get('button').contains(/^Join/);
	},
	expectPreviewClub(name: string) {
		cy.contains('h2', name).should('be.visible');
	},
	expectInvalidInvite(message?: string) {
		cy.contains('h2', 'Invalid Invite').should('be.visible');
		if (message) {
			cy.contains(message).should('be.visible');
		}
	}
} as const;
