/// <reference types="cypress" />
import { joinScreen } from '../screens/join.screen';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('Join Page', () => {
	const subjectId = 'guild-123';

	function arrangeAuthenticated(path: string) {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});
		cy.arrangeAuth({
			path,
			clubUuid: subjectId,
			guildId: subjectId,
			role: 'player',
			linkedProviders: ['discord']
		});
		cy.wsConnect();
	}

	it('shows invite code lookup form when no code is provided', () => {
		arrangeAuthenticated('/join');

		joinScreen.root().should('be.visible');
		joinScreen.codeInput().should('be.visible');
		joinScreen.lookupButton().should('be.visible');
	});

	it('navigates to join code preview after looking up a code', () => {
		cy.intercept('GET', '**/api/clubs/preview?code=ABC123', {
			statusCode: 200,
			body: {
				club_uuid: subjectId,
				club_name: 'Pier Park Club',
				role: 'player'
			}
		}).as('previewInvite');
		arrangeAuthenticated('/join');

		joinScreen.codeInput().type('ABC123');
		joinScreen.lookupButton().click();

		cy.wait('@previewInvite');
		cy.location('search').should('eq', '?code=ABC123');
		joinScreen.expectPreviewClub('Pier Park Club');
	});

	it('shows an invalid invite state when preview endpoint fails', () => {
		cy.intercept('GET', '**/api/clubs/preview?code=BADCODE', {
			statusCode: 404,
			body: { error: 'Invalid or expired invite code' }
		}).as('previewInvite');
		arrangeAuthenticated('/join?code=BADCODE');

		cy.wait('@previewInvite');
		joinScreen.expectInvalidInvite('Invalid or expired invite code');
	});

	it('joins club successfully from invite preview and redirects home', () => {
		cy.intercept('GET', '**/api/clubs/preview?code=GOODCODE', {
			statusCode: 200,
			body: {
				club_uuid: subjectId,
				club_name: 'Pier Park Club',
				role: 'player'
			}
		}).as('previewInvite');
		cy.intercept('POST', '**/api/clubs/join-by-code', {
			statusCode: 200,
			body: { ok: true }
		}).as('joinByCode');
		arrangeAuthenticated('/join?code=GOODCODE');

		cy.wait('@previewInvite');
		joinScreen.joinButton().click();

		cy.wait('@joinByCode');
		cy.location('pathname').should('eq', '/');
		cy.expectDashboardLoaded();
	});

	it('shows error when join-by-code request fails', () => {
		cy.intercept('GET', '**/api/clubs/preview?code=USED001', {
			statusCode: 200,
			body: {
				club_uuid: subjectId,
				club_name: 'Pier Park Club',
				role: 'player'
			}
		}).as('previewInvite');
		cy.intercept('POST', '**/api/clubs/join-by-code', {
			statusCode: 400,
			body: { error: 'Invite already used' }
		}).as('joinByCode');
		arrangeAuthenticated('/join?code=USED001');

		cy.wait('@previewInvite');
		joinScreen.joinButton().click();

		cy.wait('@joinByCode');
		cy.contains('Invite already used').should('be.visible');
	});
});
