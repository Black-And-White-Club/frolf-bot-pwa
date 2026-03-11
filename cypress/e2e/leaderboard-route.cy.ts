/// <reference types="cypress" />
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('Leaderboard Route', () => {
	const subjectId = 'club-123';
	const guildId = 'guild-123';

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
			leaderboard: buildLeaderboardSnapshot({ guild_id: guildId, leaderboard: entries }),
			tags: buildTagListSnapshot({ guild_id: guildId, members }),
			profiles
		});
		cy.arrangeAuth({
			path: '/leaderboard',
			clubUuid: subjectId,
			guildId,
			role: 'player'
		});
		cy.wsConnect();

		cy.contains('h1', /Leaderboard/i).should('be.visible');
		cy.get('[data-testid="leaderboard-top-three"]').should('be.visible');
		cy.contains('Player 55').should('not.exist');
		cy.contains('button', 'Load More').should('be.visible');
		cy.contains('button', 'Load More').click();
		cy.contains('button', 'Load More').should('not.exist');
		cy.contains('Player 55').should('be.visible');
	});

	it('uses the Discord guild ID for tag history requests when club UUID differs', () => {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: guildId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 2, total_points: 300, rounds_played: 5 },
					{ user_id: 'user-2', tag_number: 1, total_points: 100, rounds_played: 2 },
					{ user_id: 'user-3', tag_number: 3, total_points: 500, rounds_played: 7 }
				]
			}),
			tags: buildTagListSnapshot({
				guild_id: guildId,
				members: [
					{ member_id: 'user-1', current_tag: 2 },
					{ member_id: 'user-2', current_tag: 1 },
					{ member_id: 'user-3', current_tag: 3 }
				]
			}),
			profiles: {
				'user-1': {
					user_id: 'user-1',
					display_name: 'Player 1',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
				},
				'user-2': {
					user_id: 'user-2',
					display_name: 'Player 2',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
				},
				'user-3': {
					user_id: 'user-3',
					display_name: 'Player 3',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/2.png'
				}
			}
		});
		cy.arrangeAuth({
			path: '/leaderboard',
			clubUuid: subjectId,
			guildId,
			role: 'player'
		});
		cy.wsStubRequest(
			`leaderboard.tag.history.requested.v1.${guildId}`,
			{
				guild_id: guildId,
				entries: [
					{
						id: 1,
						tag_number: 7,
						old_member_id: 'user-2',
						new_member_id: 'user-1',
						reason: 'round_swap',
						created_at: '2026-03-01T10:00:00Z'
					},
					{
						id: 2,
						tag_number: 5,
						old_member_id: 'user-3',
						new_member_id: 'user-1',
						reason: 'round_swap',
						created_at: '2026-03-08T10:00:00Z'
					}
				]
			},
			{ validate: false }
		);
		cy.wsConnect();

		cy.get('[data-testid="leaderboard-top-three"]').children().eq(0).should('contain', 'Player 2');
		cy.get('[role="tab"]').contains('Points').click();
		cy.get('[data-testid="leaderboard-top-three"]').children().eq(0).should('contain', 'Player 3');

		cy.get('[data-testid="leaderboard-row-user-1"]').click();

		cy.wsAssertPublished(`leaderboard.tag.history.requested.v1.${guildId}`).then((entries) => {
			const lastEntry = entries[entries.length - 1];
			expect(lastEntry.payload).to.deep.equal({
				guild_id: guildId,
				member_id: 'user-1',
				limit: 100
			});
		});
		cy.getMockNats().then((mockNats) => {
			const clubScopedMessages = mockNats
				.getPublishedMessages()
				.filter((entry: { subject: string }) => {
					return entry.subject === `leaderboard.tag.history.requested.v1.${subjectId}`;
				});
			expect(clubScopedMessages).to.have.length(0);
		});

		cy.get('.history-group').should('have.length', 2);
		cy.contains('.entry-tag', '#5').should('be.visible');
	});
});
