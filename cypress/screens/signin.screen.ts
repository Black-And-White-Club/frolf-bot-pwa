import { selectors } from '../support/selectors';

export const signinScreen = {
	root() {
		return cy.contains('h2', 'Sign In').closest('div.w-full');
	},
	emailInput() {
		return cy.get('#email');
	},
	submitMagicLinkButton() {
		return cy.contains('button', 'Send Magic Link');
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
	expectMagicLinkSuccess() {
		cy.contains('Check your email for the magic link!').should('be.visible');
	},
	expectMagicLinkError() {
		cy.contains('Something went wrong. Please try again.').should('be.visible');
	}
} as const;
