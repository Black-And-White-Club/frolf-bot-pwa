/// <reference types="cypress" />
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('Leaderboard Route', () => {
	const subjectId = 'guild-123';

	it('renders leaderboard route and supports load-more pagination', () => {
		const entries = Array.from({ length: 55 }, (_, index) => ({
			user_id: `user-${index + 1}`,
			tag_number: index + 1,
			total_points: 1000 - index * 10,
			rounds_played: 12
		}));
		const members = entries.map((entry) => ({
			member_id: entry.user_id,
			current_tag: entry.tag_number
		}));
		const profiles = Object.fromEntries(
			entries.map((entry, index) => [
				entry.user_id,
				{
					user_id: entry.user_id,
					display_name: `Player ${index + 1}`,
					avatar_url: `https://cdn.discordapp.com/embed/avatars/${index % 5}.png`
				}
			])
		);

		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: entries }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members }),
			profiles
		});
		cy.arrangeAuth({
			path: '/leaderboard',
			clubUuid: subjectId,
			guildId: subjectId,
			role: 'player'
		});
		cy.wsConnect();

		cy.contains('h1', /Leaderboard/i).should('be.visible');
		cy.contains('Player 55').should('not.exist');
		cy.contains('button', 'Load More').should('be.visible');
		cy.contains('button', 'Load More').click();
		cy.contains('button', 'Load More').should('not.exist');
		cy.contains('Player 55').should('be.visible');
	});
});
