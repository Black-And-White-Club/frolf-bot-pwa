/// <reference types="cypress" />
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';
import { leaderboardScreen } from '../screens/leaderboard.screen';
import { roundScreen } from '../screens/round.screen';

describe('Dashboard Snapshot + Live Events', () => {
	const subjectId = 'guild-123';

	beforeEach(() => {
		cy.step('Arrange snapshot with stubbed players/rounds');
		cy.arrangeSnapshot({
			subjectId,
			rounds: [
				buildRoundCreated({
					id: 'round-stub-1',
					guild_id: subjectId,
					title: 'Stubbed Round',
					state: 'started',
					participants: [
						{
							user_id: 'user-1',
							response: 'accepted',
							score: null,
							tag_number: 1
						}
					]
				})
			],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: subjectId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 2, total_points: 500, rounds_played: 8 },
					{ user_id: 'user-2', tag_number: 5, total_points: 450, rounds_played: 7 }
				]
			}),
			tags: buildTagListSnapshot({
				guild_id: subjectId,
				members: [
					{ member_id: 'user-1', current_tag: 2 },
					{ member_id: 'user-2', current_tag: 5 }
				]
			}),
			profiles: {
				'user-1': {
					user_id: 'user-1',
					display_name: 'Stubbed Player One',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
				},
				'user-2': {
					user_id: 'user-2',
					display_name: 'Stubbed Player Two',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
				}
			}
		});

		cy.arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
		cy.wsConnect();
		cy.expectDashboardLoaded();
		cy.wsAssertPublished(`round.list.request.v1.${subjectId}`);
	});

	it('renders snapshot data without waiting for full end-to-end flow', () => {
		roundScreen.cards().should('have.length', 1);
		roundScreen.expectCardContains('round-stub-1', 'Stubbed Round');
		leaderboardScreen.expectRowCount(2);
		cy.contains('Stubbed Player One').should('exist');
	});

	it('applies live websocket events after initial snapshot', () => {
		cy.step('Emit live round + leaderboard tag updates');
		roundScreen.cards().should('have.length', 1);

		cy.wsRunScenario('contracts/scenarios/round/created.live.json', { subjectId });
		cy.wsRunScenario('contracts/scenarios/leaderboard/tag.updated.simple.json', { subjectId });

		roundScreen.cards().should('have.length', 2);
		roundScreen.expectCardContains('round-live-2', 'Live Round from WS');
		leaderboardScreen.expectFirstUser('user-2');
	});
});
