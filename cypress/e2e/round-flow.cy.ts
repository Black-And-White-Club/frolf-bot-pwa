/// <reference types="cypress" />
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { roundScreen } from '../screens/round.screen';

describe('Round Flow', () => {
	const subjectId = 'guild-123';

	beforeEach(() => {
		cy.step('Arrange round/leaderboard/tag snapshots');
		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});
		cy.step('Arrange authenticated session');
		cy.arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
		cy.wsConnect({
			requiredSubjects: [
				`round.created.v1.${subjectId}`,
				`round.started.v1.${subjectId}`,
				`round.participant.joined.v1.${subjectId}`,
				`round.participant.score.updated.v1.${subjectId}`,
				`round.deleted.v1.${subjectId}`
			]
		});
		cy.expectDashboardLoaded();
		cy.wsAssertPublished(`round.list.request.v1.${subjectId}`);
	});

	it('displays a new round when round.created is received', () => {
		cy.step('Emit round.created from scenario fixture');
		cy.wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });

		roundScreen.expectCardVisible('round-1');
		roundScreen.expectCardContains('round-1', 'Weekly Tag Round');
		roundScreen.expectCardContains('round-1', 'Pier Park');
	});

	it('updates card state when round.started is received', () => {
		cy.step('Seed scheduled round from fixture');
		cy.wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });

		cy.step('Emit round.started from fixture');
		cy.wsRunScenario('contracts/scenarios/round/started.round-1.json', { subjectId });

		roundScreen.expectCardState('round-1', 'started');
	});

	it('updates participant count when round.participant.joined is received', () => {
		cy.step('Seed round for participant join');
		cy.wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });

		cy.step('Emit round.participant.joined from fixture');
		cy.wsRunScenario('contracts/scenarios/round/participant.joined.round-1.json', { subjectId });

		roundScreen.expectParticipantLabel('round-1', 1);
	});

	it('shows score preview after round.participant.score.updated on finalized rounds', () => {
		cy.step('Seed finalized round from fixture');
		cy.wsRunScenario('contracts/scenarios/round/created.finalized.with-score-target.json', {
			subjectId
		});

		cy.step('Emit round.participant.score.updated from fixture');
		cy.wsRunScenario('contracts/scenarios/round/participant.score.updated.round-1-user-2.json', {
			subjectId
		});

		roundScreen.expectCardContains('round-1', '-3');
	});

	it('removes the round card when round.deleted is received', () => {
		cy.step('Seed round to delete');
		cy.wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });
		roundScreen.expectCardVisible('round-1');

		cy.step('Emit round.deleted from fixture');
		cy.wsRunScenario('contracts/scenarios/round/deleted.round-1.json', { subjectId });

		roundScreen.expectCardMissing('round-1');
	});
});
