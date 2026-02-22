import { selectors } from '../support/selectors';

export const signinScreen = {
	root() {
		return cy.contains('h2', 'Sign In').closest('div.w-full');
	},
	discordButton() {
		return cy.contains('a', 'Sign in with Discord');
	},
	googleButton() {
		return cy.contains('a', 'Sign in with Google');
	},
	expectGuestSignInCta() {
		cy.get(selectors.signInButton).should('be.visible').and('contain', 'Sign In');
	},
	expectOAuthError() {
		cy.contains('Sign-in failed. Please try again.').should('be.visible');
	},
	expectOAuthOnlyUi() {
		cy.get('#email').should('not.exist');
		cy.contains('button', 'Send Magic Link').should('not.exist');
	}
} as const;
