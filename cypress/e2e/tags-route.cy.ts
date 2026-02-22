/// <reference types="cypress" />
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('Tags Route', () => {
	const subjectId = 'guild-123';

	it('renders tag leaderboard and tag history sheet interactions', () => {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: subjectId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
					{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 }
				]
			}),
			tags: buildTagListSnapshot({
				guild_id: subjectId,
				members: [
					{ member_id: 'user-1', current_tag: 1 },
					{ member_id: 'user-2', current_tag: 2 }
				]
			}),
			profiles: {
				'user-1': {
					user_id: 'user-1',
					display_name: 'Player One',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
				},
				'user-2': {
					user_id: 'user-2',
					display_name: 'Player Two',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
				}
			}
		});
		cy.arrangeAuth({ path: '/tags', clubUuid: subjectId, guildId: subjectId, role: 'player' });
		cy.wsConnect();

		cy.expectDashboardLoaded();
		cy.contains('Tag Leaderboard').should('be.visible');
		cy.get('[aria-label^="Select "]').first().click();
		cy.contains('Tag History').should('be.visible');
		cy.contains('No tag history available.').should('be.visible');
	});
});
