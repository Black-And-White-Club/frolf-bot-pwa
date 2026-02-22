/// <reference types="cypress" />
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { signinScreen } from '../screens/signin.screen';

describe('Auth and Sign-in Routes', () => {
	const subjectId = 'guild-123';

	function arrangeAuthenticated(path: string) {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});
		cy.arrangeAuth({ path, clubUuid: subjectId, guildId: subjectId, role: 'admin' });
		cy.wsConnect();
	}

	it('shows guest sign-in call-to-action on home when unauthenticated', () => {
		cy.arrangeGuest({ path: '/' });

		signinScreen.expectGuestSignInCta();
		cy.contains('a', 'Privacy Policy').should('have.attr', 'href', '/privacy');
		cy.contains('a', 'Terms of Service').should('have.attr', 'href', '/tos');
	});

	it('renders sign-in page for authenticated sessions', () => {
		arrangeAuthenticated('/auth/signin');

		signinScreen.root().should('be.visible');
		signinScreen.discordButton().should('have.attr', 'href', '/api/auth/discord/login');
		signinScreen.googleButton().should('have.attr', 'href', '/api/auth/google/login');
	});

	it('shows oauth error banner when error query param is set', () => {
		arrangeAuthenticated('/auth/signin?error=oauth_failed');

		signinScreen.expectOAuthError();
	});

	it('submits magic-link email successfully', () => {
		cy.intercept('POST', '**/api/auth/login', {
			statusCode: 200,
			body: { ok: true }
		}).as('magicLinkRequest');
		arrangeAuthenticated('/auth/signin');

		signinScreen.emailInput().type('player@example.com');
		signinScreen.submitMagicLinkButton().click();

		cy.wait('@magicLinkRequest');
		signinScreen.expectMagicLinkSuccess();
	});

	it('shows magic-link error when login request fails', () => {
		cy.intercept('POST', '**/api/auth/login', {
			statusCode: 500,
			body: { error: 'Internal error' }
		}).as('magicLinkRequest');
		arrangeAuthenticated('/auth/signin');

		signinScreen.emailInput().type('player@example.com');
		signinScreen.submitMagicLinkButton().click();

		cy.wait('@magicLinkRequest');
		signinScreen.expectMagicLinkError();
	});
});
