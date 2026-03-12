/// <reference types="cypress" />
import {
	buildLeaderboardSnapshot,
	buildRoundListSnapshot,
	buildTagListSnapshot
} from '../support/event-builders';

describe('Challenges Routes', () => {
	const subjectId = 'club-123';
	const guildId = 'guild-123';

	function buildChallenge(
		overrides: Partial<{
			id: string;
			status: string;
			accepted_at: string | null;
			accepted_expires_at: string | null;
			completed_at: string | null;
			linked_round: {
				round_id: string;
				linked_at: string;
				is_active: boolean;
				unlinked_at?: string | null;
			} | null;
		}> = {}
	) {
		return {
			id: overrides.id ?? 'challenge-1',
			club_uuid: subjectId,
			discord_guild_id: guildId,
			status: overrides.status ?? 'open',
			challenger_user_uuid: 'user-uuid-1',
			defender_user_uuid: 'user-uuid-2',
			challenger_external_id: 'user-1',
			defender_external_id: 'user-2',
			original_tags: { challenger: 8, defender: 3 },
			current_tags: { challenger: 8, defender: 3 },
			opened_at: '2026-03-10T12:00:00Z',
			open_expires_at: '2026-03-12T12:00:00Z',
			accepted_at: overrides.accepted_at ?? null,
			accepted_expires_at: overrides.accepted_expires_at ?? null,
			linked_round: overrides.linked_round ?? null,
			completed_at: overrides.completed_at ?? null,
			hidden_at: null,
			hidden_by_user_uuid: null,
			message_binding: null
		};
	}

	function arrangeChallengeSession(path: string) {
		cy.arrangeSnapshot({
			subjectId,
			rounds: buildRoundListSnapshot({
				rounds: [
					{
						id: 'round-55',
						guild_id: guildId,
						title: 'Challenge Finals',
						location: 'Pier Park',
						description: '',
						start_time: '2026-03-14T16:00:00Z',
						state: 'scheduled',
						created_by: 'user-1',
						event_message_id: 'msg-55',
						participants: []
					}
				]
			}).rounds,
			leaderboard: buildLeaderboardSnapshot({ guild_id: guildId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: guildId, members: [] })
		});
		cy.arrangeAuth({
			path,
			clubUuid: subjectId,
			guildId,
			role: 'player',
			linkedProviders: ['discord']
		});
	}

	it('renders the challenge board and deep-links cards to the detail route', () => {
		const openChallenge = buildChallenge({ id: 'challenge-open' });
		const acceptedChallenge = buildChallenge({
			id: 'challenge-accepted',
			status: 'accepted',
			accepted_at: '2026-03-10T13:00:00Z',
			accepted_expires_at: '2026-03-14T13:00:00Z'
		});

		cy.wsStubRequest(
			`club.challenge.list.request.v1.${subjectId}`,
			{
				challenges: [openChallenge, acceptedChallenge]
			},
			{ validate: false }
		);
		cy.wsStubRequest(
			`club.challenge.detail.request.v1.${subjectId}`,
			{
				challenge: openChallenge
			},
			{ validate: false }
		);
		arrangeChallengeSession('/challenges');
		cy.wsConnect();

		cy.get('[data-testid="challenges-page"]').should('be.visible');
		cy.get('[data-testid="challenge-board"]').should('be.visible');
		cy.get('[data-testid="challenge-card-challenge-open"]').should('be.visible');
		cy.get('[data-testid="challenge-card-challenge-open"]')
			.contains('a', 'View challenge')
			.should('have.attr', 'href', '/challenges/challenge-open')
			.click();

		cy.location('pathname').should('eq', '/challenges/challenge-open');
		cy.get('[data-testid="challenge-detail-page"]').should('be.visible');
	});

	it('loads archived challenges on the detail route even when they are not board-visible', () => {
		cy.wsStubRequest(
			`club.challenge.list.request.v1.${subjectId}`,
			{
				challenges: [buildChallenge({ id: 'challenge-open' })]
			},
			{ validate: false }
		);
		cy.wsStubRequest(
			`club.challenge.detail.request.v1.${subjectId}`,
			{
				challenge: buildChallenge({
					id: 'challenge-completed',
					status: 'completed',
					accepted_at: '2026-03-10T13:00:00Z',
					completed_at: '2026-03-10T18:00:00Z',
					linked_round: {
						round_id: 'round-55',
						linked_at: '2026-03-10T14:00:00Z',
						is_active: false,
						unlinked_at: '2026-03-10T18:30:00Z'
					}
				})
			},
			{ validate: false }
		);
		arrangeChallengeSession('/challenges/challenge-completed');
		cy.wsConnect();

		cy.get('[data-testid="challenge-detail-page"]').should('be.visible');
		cy.wsAssertPublished(`club.challenge.detail.request.v1.${subjectId}`).then((entries) => {
			const lastEntry = entries[entries.length - 1];
			expect(lastEntry.payload).to.deep.equal({
				guild_id: guildId,
				club_uuid: subjectId,
				challenge_id: 'challenge-completed'
			});
		});
		cy.get('[data-testid="challenge-card-challenge-completed"]')
			.should('have.attr', 'data-challenge-status', 'completed')
			.and('contain', 'Completed');
		cy.contains('Challenge Finals').should('be.visible');
		cy.contains('Completed').should('be.visible');
	});
});
