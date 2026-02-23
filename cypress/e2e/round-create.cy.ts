/// <reference types="cypress" />
import { createRoundScreen } from '../screens/create-round.screen';
import { roundScreen } from '../screens/round.screen';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('Round Create Route', () => {
	const subjectId = 'guild-123';

	function arrangeRoundCreateSession(role: 'viewer' | 'player' | 'editor' | 'admin', path: string) {
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
			role,
			linkedProviders: ['discord']
		});
		cy.wsConnect();
	}

	it('allows player to submit create-round request and returns to rounds route', () => {
		arrangeRoundCreateSession('player', '/rounds');
		cy.wsAssertPublished(`round.list.request.v1.${subjectId}`);

		createRoundScreen.createRouteButton().should('be.visible').click();
		cy.location('pathname').should('eq', '/rounds/create');
		createRoundScreen.createPage().should('be.visible');

		createRoundScreen.fillForm({
			title: 'PWA Created Round',
			description: 'Testing web create flow',
			startTime: '2026-02-24 18:30',
			timezone: 'America/Chicago',
			location: 'Pier Park'
		});
		createRoundScreen.submit();

		cy.wsAssertPublished('round.creation.requested.v1', (entry) => {
			const payload = entry.payload as Record<string, string>;
			return (
				payload.guild_id === subjectId &&
				payload.user_id === 'user-1' &&
				payload.title === 'PWA Created Round' &&
				payload.location === 'Pier Park' &&
				payload.start_time === '2026-02-24 18:30' &&
				payload.timezone === 'America/Chicago' &&
				payload.channel_id === ''
			);
		});

		cy.location('pathname').should('eq', '/rounds');
		cy.location('search').should('include', 'created=requested');
		createRoundScreen.expectRequestedBannerVisible();

		cy.wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });
		roundScreen.expectCardVisible('round-1');
	});

	it('hides create button for viewer and blocks direct access to /rounds/create', () => {
		arrangeRoundCreateSession('viewer', '/rounds');

		createRoundScreen.createRouteButton().should('not.exist');

		cy.visit('/rounds/create');
		cy.location('pathname').should('eq', '/rounds');
	});
});
