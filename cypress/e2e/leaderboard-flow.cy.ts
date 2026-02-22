/// <reference types="cypress" />
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { leaderboardScreen } from '../screens/leaderboard.screen';

describe('Leaderboard Flow', () => {
	const subjectId = 'guild-123';

	beforeEach(() => {
		cy.step('Arrange leaderboard snapshot');
		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: subjectId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
					{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 },
					{ user_id: 'user-3', tag_number: 3, total_points: 425, rounds_played: 6 }
				]
			}),
			tags: buildTagListSnapshot({
				guild_id: subjectId,
				members: [
					{ member_id: 'user-1', current_tag: 1 },
					{ member_id: 'user-2', current_tag: 2 },
					{ member_id: 'user-3', current_tag: 3 }
				]
			})
		});
		cy.arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
		cy.wsConnect();
		cy.expectDashboardLoaded();
		cy.wsAssertPublished(`leaderboard.snapshot.request.v1.${subjectId}`);
	});

	it('displays leaderboard rows from snapshot', () => {
		cy.expectLeaderboardLoaded({ minRows: 3 });
		leaderboardScreen.expectRowCount(3);
		leaderboardScreen.expectFirstUser('user-1');
	});

	it('reorders rows after leaderboard.tag.updated', () => {
		cy.step('Arrange two-user leaderboard snapshot');
		cy.arrangeSnapshot({
			subjectId,
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
			})
		});

		cy.step('Emit leaderboard.updated and leaderboard.tag.updated');
		cy.wsRunScenario('contracts/scenarios/leaderboard/updated.round-1.json', { subjectId });
		leaderboardScreen.expectFirstUser('user-1');

		cy.wsRunScenario('contracts/scenarios/leaderboard/tag.updated.simple.json', { subjectId });
		leaderboardScreen.expectFirstUser('user-2');
	});

	it('swaps tags after leaderboard.tag.swap.processed', () => {
		cy.step('Arrange swap baseline');
		cy.arrangeSnapshot({
			subjectId,
			leaderboard: buildLeaderboardSnapshot({
				guild_id: subjectId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
					{ user_id: 'user-2', tag_number: 5, total_points: 450, rounds_played: 7 }
				]
			}),
			tags: buildTagListSnapshot({
				guild_id: subjectId,
				members: [
					{ member_id: 'user-1', current_tag: 1 },
					{ member_id: 'user-2', current_tag: 5 }
				]
			})
		});

		cy.step('Emit tag swap processed');
		cy.wsRunScenario('contracts/scenarios/leaderboard/updated.round-1.json', { subjectId });
		cy.wsRunScenario('contracts/scenarios/leaderboard/tag.swap.processed.simple.json', {
			subjectId
		});

		leaderboardScreen.expectFirstUser('user-2');
	});

	it('reloads snapshot after leaderboard.updated event', () => {
		cy.step('Stub refreshed leaderboard snapshot');
		leaderboardScreen.expectRowCount(3);

		cy.wsStubRequest(
			`leaderboard.snapshot.request.v1.${subjectId}`,
			buildLeaderboardSnapshot({
				guild_id: subjectId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
					{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 },
					{ user_id: 'user-3', tag_number: 3, total_points: 425, rounds_played: 6 },
					{ user_id: 'user-4', tag_number: 4, total_points: 390, rounds_played: 6 }
				]
			}),
			{ validate: false }
		);
		cy.wsStubRequest(
			`leaderboard.tag.list.requested.v1.${subjectId}`,
			buildTagListSnapshot({
				guild_id: subjectId,
				members: [
					{ member_id: 'user-1', current_tag: 1 },
					{ member_id: 'user-2', current_tag: 2 },
					{ member_id: 'user-3', current_tag: 3 },
					{ member_id: 'user-4', current_tag: 4 }
				]
			}),
			{ validate: false }
		);

		cy.step('Emit leaderboard.updated to trigger reload');
		cy.wsRunScenario('contracts/scenarios/leaderboard/updated.round-2.json', { subjectId });
		leaderboardScreen.expectRowCount(4);
	});
});
