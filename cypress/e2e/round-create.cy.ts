/// <reference types="cypress" />
import { createRoundScreen } from '../screens/create-round.screen';
import { roundScreen } from '../screens/round.screen';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('Round Create Route', () => {
	const subjectId = 'guild-123';

	function buildChallenge(
		id: string,
		overrides: Partial<{
			status: string;
			discord_guild_id: string | null;
			accepted_at: string | null;
			accepted_expires_at: string | null;
			linked_round: {
				round_id: string;
				linked_at: string;
				is_active: boolean;
			} | null;
		}> = {}
	) {
		return {
			id,
			club_uuid: 'club-123',
			discord_guild_id: overrides.discord_guild_id ?? 'guild-123',
			status: overrides.status ?? 'accepted',
			challenger_user_uuid: 'user-uuid-1',
			defender_user_uuid: 'user-uuid-2',
			challenger_external_id: 'user-1',
			defender_external_id: 'user-2',
			original_tags: { challenger: 8, defender: 3 },
			current_tags: { challenger: 8, defender: 3 },
			opened_at: '2026-03-10T12:00:00Z',
			open_expires_at: '2026-03-12T12:00:00Z',
			accepted_at: overrides.accepted_at ?? '2026-03-10T13:00:00Z',
			accepted_expires_at: overrides.accepted_expires_at ?? '2026-03-14T13:00:00Z',
			linked_round: overrides.linked_round ?? null,
			completed_at: null,
			hidden_at: null,
			hidden_by_user_uuid: null,
			message_binding: null
		};
	}

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
		cy.wsAssertPublished(`round.list.request.v2.${subjectId}`);

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

		cy.wsAssertPublished('round.creation.requested.v2', (entry) => {
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

	it('deep-links challenge scheduling into create-round and returns to the challenge detail route', () => {
		const clubSubjectId = 'club-123';
		const guildId = 'guild-123';
		const challengeId = '11111111-1111-1111-1111-111111111111';
		const acceptedChallenge = buildChallenge(challengeId);

		cy.arrangeSnapshot({
			subjectId: clubSubjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: guildId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: guildId, members: [] })
		});
		cy.wsStubRequest(
			`club.challenge.list.request.v1.${clubSubjectId}`,
			{
				challenges: [acceptedChallenge]
			},
			{ validate: false }
		);
		cy.wsStubRequest(
			`club.challenge.detail.request.v1.${clubSubjectId}`,
			{
				challenge: acceptedChallenge
			},
			{ validate: false }
		);
		cy.arrangeAuth({
			path: `/challenges/${challengeId}`,
			clubUuid: clubSubjectId,
			guildId,
			role: 'player',
			linkedProviders: ['discord']
		});
		cy.wsConnect();

		cy.get(`[data-testid="challenge-card-${challengeId}"]`).contains('a', 'Create Round').click();

		cy.location('pathname').should('eq', '/rounds/create');
		cy.location('search').should('include', `challenge=${challengeId}`);
		cy.contains('This round will auto-link to the selected challenge').should('be.visible');
		cy.get('[data-testid="link-create-round-cancel"]').should(
			'have.attr',
			'href',
			`/challenges/${challengeId}`
		);

		createRoundScreen.fillForm({
			title: 'Challenge Match',
			description: 'Created from a challenge detail route',
			startTime: '2026-03-14 16:00',
			timezone: 'America/New_York',
			location: 'Pier Park'
		});
		createRoundScreen.submit();

		cy.wsAssertPublished('round.creation.requested.v2', (entry) => {
			const payload = entry.payload as Record<string, string>;
			return (
				payload.guild_id === guildId &&
				payload.user_id === 'user-1' &&
				payload.title === 'Challenge Match' &&
				payload.location === 'Pier Park' &&
				payload.challenge_id === challengeId
			);
		});

		cy.location('pathname').should('eq', `/challenges/${challengeId}`);
		cy.location('search').should('include', 'created=requested');
		cy.contains(
			'Round creation requested. The challenge will auto-link after the round is created.'
		).should('be.visible');
	});

	it('deep-links challenge scheduling for a club without a discord guild mapping', () => {
		const clubSubjectId = 'club-123';
		const challengeId = '99999999-1111-1111-1111-111111111111';
		const acceptedChallenge = buildChallenge(challengeId, { discord_guild_id: null });

		cy.arrangeSnapshot({
			subjectId: clubSubjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: clubSubjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: clubSubjectId, members: [] })
		});
		cy.wsStubRequest(
			`club.challenge.list.request.v1.${clubSubjectId}`,
			{
				challenges: [acceptedChallenge]
			},
			{ validate: false }
		);
		cy.wsStubRequest(
			`club.challenge.detail.request.v1.${clubSubjectId}`,
			{
				challenge: acceptedChallenge
			},
			{ validate: false }
		);
		cy.arrangeAuth({
			path: `/challenges/${challengeId}`,
			clubUuid: clubSubjectId,
			role: 'player',
			linkedProviders: [],
			claims: {
				guild: ''
			}
		});
		cy.wsConnect();

		cy.get(`[data-testid="challenge-card-${challengeId}"]`).contains('a', 'Create Round').click();

		cy.location('pathname').should('eq', '/rounds/create');
		cy.location('search').should('include', `challenge=${challengeId}`);

		createRoundScreen.fillForm({
			title: 'Club Scoped Challenge Match',
			description: 'Created without a discord guild mapping',
			startTime: '2026-03-15 16:00',
			timezone: 'America/New_York',
			location: 'Pier Park'
		});
		createRoundScreen.submit();

		cy.wsAssertPublished('round.creation.requested.v2', (entry) => {
			const payload = entry.payload as Record<string, string>;
			return (
				payload.guild_id === clubSubjectId &&
				payload.user_id === 'user-1' &&
				payload.title === 'Club Scoped Challenge Match' &&
				payload.challenge_id === challengeId
			);
		});

		cy.location('pathname').should('eq', `/challenges/${challengeId}`);
		cy.location('search').should('include', 'created=requested');
	});
});
