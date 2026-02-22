/// <reference types="cypress" />
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { dashboardScreen } from '../screens/dashboard.screen';
import { leaderboardScreen } from '../screens/leaderboard.screen';
import { roundScreen } from '../screens/round.screen';

describe('Dashboard', () => {
	const subjectId = 'guild-123';

	describe('Mock Mode', () => {
		it('displays dashboard shells without live NATS', () => {
			cy.step('Visit dashboard in mock mode');
			cy.visitMockMode();

			cy.expectDashboardLoaded();
			dashboardScreen.expectRoundCountAtLeast(1);
		});

		it('shows loading state and then round cards', () => {
			cy.step('Visit mock mode and wait for rounds');
			cy.visitMockMode();

			dashboardScreen.expectRoundCountAtLeast(1);
		});
	});

	describe('Live NATS Events', () => {
		beforeEach(() => {
			cy.step('Arrange baseline live snapshot');
			cy.arrangeSnapshot({
				subjectId,
				rounds: [],
				leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
				tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
			});
			cy.arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
			cy.wsConnect();
			cy.expectDashboardLoaded();
			leaderboardScreen.setMode('points');
			cy.wsAssertPublished(`round.list.request.v1.${subjectId}`);
		});

		it('renders newly created round from event stream', () => {
			cy.step('Emit round.created from fixture scenario');
			cy.wsRunScenario('contracts/scenarios/round/created.live.json', { subjectId });

			roundScreen.expectCardContains('round-live-2', 'Live Round from WS');
		});

		it('reloads leaderboard snapshot after leaderboard.updated event', () => {
			cy.step('Arrange refreshed leaderboard snapshot');
			cy.arrangeSnapshot({
				subjectId,
				leaderboard: buildLeaderboardSnapshot({
					leaderboard: [
						{ tag_number: 1, user_id: 'user-live-1', total_points: 1111, rounds_played: 14 }
					]
				})
			});

			cy.step('Emit leaderboard.updated from contract scenario');
			cy.wsRunScenario('contracts/scenarios/leaderboard/updated.round-1.json', { subjectId });

			cy.expectLeaderboardLoaded({ minRows: 1 });
		});
	});
});
