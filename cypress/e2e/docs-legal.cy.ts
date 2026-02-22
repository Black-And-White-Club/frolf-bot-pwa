/// <reference types="cypress" />
import { docsScreen } from '../screens/docs.screen';
import { legalScreen } from '../screens/legal.screen';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('Docs and Legal Routes', () => {
	const subjectId = 'guild-123';

	it('renders docs overview and navigates between doc sections', () => {
		cy.arrangeGuest({ path: '/docs' });

		docsScreen.expectHeading('Frolf Bot — Documentation');
		docsScreen.clickNavItem('Rounds');
		cy.location('pathname').should('eq', '/docs/rounds');
		docsScreen.expectHeading('Rounds');
	});

	it('uses the active docs navigation container for the current layout', () => {
		cy.arrangeGuest({ path: '/docs' });

		docsScreen.isCompactLayout().then((isCompact) => {
			if (!isCompact) {
				docsScreen.mobileNavToggle().should('not.be.visible');
				docsScreen.sidebarNav().should('be.visible');
				docsScreen.clickNavItem('Tags & Leaderboard');
				cy.location('pathname').should('eq', '/docs/tags');
				docsScreen.expectHeading('Tags & Leaderboard');
				return;
			}

			docsScreen.mobileNavToggle().should('be.visible');
			docsScreen.openMobileNav();
			docsScreen.mobileNav().should('be.visible');
			docsScreen.clickNavItem('Tags & Leaderboard');
			cy.location('pathname').should('eq', '/docs/tags');
			docsScreen.expectHeading('Tags & Leaderboard');
		});
	});

	it('renders privacy policy and links to terms', () => {
		cy.arrangeGuest({ path: '/privacy' });

		legalScreen.expectPrivacyPage();
		legalScreen.expectLegalFooterLinks();
		cy.contains('a', 'Terms of Service').first().click();
		cy.location('pathname').should('eq', '/tos');
		legalScreen.expectTosPage();
	});

	it('renders terms of service and links back to privacy', () => {
		cy.arrangeGuest({ path: '/tos' });

		legalScreen.expectTosPage();
		legalScreen.expectLegalFooterLinks();
		cy.contains('a', 'Privacy Policy').first().click();
		cy.location('pathname').should('eq', '/privacy');
		legalScreen.expectPrivacyPage();
	});

	it('renders auth error route for authenticated sessions', () => {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});
		cy.arrangeAuth({
			path: '/auth/error',
			clubUuid: subjectId,
			guildId: subjectId,
			role: 'player'
		});
		cy.wsConnect();

		cy.contains('h1', 'Auth Error').should('be.visible');
		cy.contains('a', 'Return Home').should('have.attr', 'href', '/');
	});
});
