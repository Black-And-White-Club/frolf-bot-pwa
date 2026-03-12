// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPublish = vi.fn();
const mockRequest = vi.fn();

const mockAuth = {
	isAuthenticated: true,
	activeRole: 'player' as 'viewer' | 'player' | 'editor' | 'admin',
	user: {
		id: 'discord-user-1',
		uuid: '11111111-1111-4111-8111-111111111111',
		activeClubUuid: 'club-123',
		guildId: 'guild-123'
	}
};

const mockTagStore = {
	tagList: [] as Array<{ memberId: string; currentTag: number | null }>
};

vi.mock('../auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('../nats.svelte', () => ({
	nats: {
		isConnected: true,
		publish: mockPublish,
		request: mockRequest
	}
}));

vi.mock('../tags.svelte', () => ({
	tagStore: mockTagStore
}));

type ChallengeRawOverrides = Partial<{
	id: string;
	status: string;
	challenger_user_uuid: string;
	defender_user_uuid: string;
	challenger_external_id: string | null;
	defender_external_id: string | null;
	current_tags: { challenger: number | null; defender: number | null };
	linked_round: { round_id: string; linked_at: string; is_active: boolean } | null;
	accepted_at: string | null;
	accepted_expires_at: string | null;
	completed_at: string | null;
	hidden_at: string | null;
}>;

const challengeRawBase = {
	id: 'challenge-1',
	club_uuid: 'club-123',
	status: 'open',
	challenger_user_uuid: '11111111-1111-4111-8111-111111111111',
	defender_user_uuid: '22222222-2222-4222-8222-222222222222',
	challenger_external_id: 'discord-user-1',
	defender_external_id: 'discord-user-2',
	original_tags: { challenger: 8, defender: 3 },
	current_tags: { challenger: 8, defender: 3 },
	opened_at: '2026-03-10T12:00:00Z',
	open_expires_at: '2026-03-12T12:00:00Z',
	accepted_at: null,
	accepted_expires_at: null,
	linked_round: null,
	completed_at: null,
	hidden_at: null,
	hidden_by_user_uuid: null,
	message_binding: null
};

function buildChallengeRaw(overrides: ChallengeRawOverrides = {}) {
	return {
		...challengeRawBase,
		...overrides,
		original_tags: { ...challengeRawBase.original_tags },
		current_tags: overrides.current_tags ?? { ...challengeRawBase.current_tags }
	};
}

function buildChallengeFact(
	overrides: Partial<{
		id: string;
		status: string;
		challenger_user_uuid: string;
		defender_user_uuid: string;
		challenger_external_id: string | null;
		defender_external_id: string | null;
		current_tags: { challenger: number | null; defender: number | null };
		linked_round: { round_id: string; linked_at: string; is_active: boolean } | null;
		accepted_at: string | null;
		accepted_expires_at: string | null;
		completed_at: string | null;
		hidden_at: string | null;
	}>
) {
	return {
		challenge: buildChallengeRaw(overrides)
	};
}

describe('challengeStore', () => {
	beforeEach(() => {
		vi.resetModules();
		mockPublish.mockReset();
		mockRequest.mockReset();
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = {
			id: 'discord-user-1',
			uuid: '11111111-1111-4111-8111-111111111111',
			activeClubUuid: 'club-123',
			guildId: 'guild-123'
		};
		mockTagStore.tagList = [
			{ memberId: '11111111-1111-4111-8111-111111111111', currentTag: 8 },
			{ memberId: '22222222-2222-4222-8222-222222222222', currentTag: 3 }
		];
	});

	it('publishes a challenge-open request with club identity and actor ids', async () => {
		const mod = await import('../challenges.svelte');

		const result = await mod.challengeStore.openChallenge('discord-user-2');

		expect(result).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith('club.challenge.open.requested.v1', {
			guild_id: 'guild-123',
			club_uuid: 'club-123',
			actor_user_uuid: '11111111-1111-4111-8111-111111111111',
			actor_external_id: 'discord-user-1',
			target_user_uuid: undefined,
			target_external_id: 'discord-user-2'
		});
	});

	it('publishes canonical target_user_uuid when a user UUID is available', async () => {
		const mod = await import('../challenges.svelte');

		const result = await mod.challengeStore.openChallenge('22222222-2222-4222-8222-222222222222');

		expect(result).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith('club.challenge.open.requested.v1', {
			guild_id: 'guild-123',
			club_uuid: 'club-123',
			actor_user_uuid: '11111111-1111-4111-8111-111111111111',
			actor_external_id: 'discord-user-1',
			target_user_uuid: '22222222-2222-4222-8222-222222222222',
			target_external_id: undefined
		});
	});

	it('falls back to actor_external_id when the authenticated user UUID is unavailable', async () => {
		mockAuth.user = {
			id: 'discord-user-1',
			uuid: '',
			activeClubUuid: 'club-123',
			guildId: 'guild-123'
		};

		const mod = await import('../challenges.svelte');

		const result = await mod.challengeStore.openChallenge('discord-user-2');

		expect(result).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith('club.challenge.open.requested.v1', {
			guild_id: 'guild-123',
			club_uuid: 'club-123',
			actor_user_uuid: undefined,
			actor_external_id: 'discord-user-1',
			target_user_uuid: undefined,
			target_external_id: 'discord-user-2'
		});
	});

	it('uses actor_external_id fallback for challenge actions when the authenticated user UUID is unavailable', async () => {
		mockAuth.user = {
			id: 'discord-user-1',
			uuid: '',
			activeClubUuid: 'club-123',
			guildId: 'guild-123'
		};

		const mod = await import('../challenges.svelte');

		const result = await mod.challengeStore.withdrawChallenge('challenge-1');

		expect(result).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith('club.challenge.withdraw.requested.v1', {
			guild_id: 'guild-123',
			club_uuid: 'club-123',
			actor_user_uuid: undefined,
			actor_external_id: 'discord-user-1',
			challenge_id: 'challenge-1'
		});
	});

	it('loads a single challenge detail via the dedicated detail request subject', async () => {
		mockRequest.mockResolvedValueOnce({
			challenge: buildChallengeRaw({
				id: 'challenge-archived',
				status: 'completed',
				accepted_at: '2026-03-10T14:00:00Z',
				completed_at: '2026-03-10T17:30:00Z'
			})
		});

		const mod = await import('../challenges.svelte');
		const detail = await mod.challengeStore.loadDetail('challenge-archived');

		expect(mockRequest).toHaveBeenCalledWith('club.challenge.detail.request.v1.club-123', {
			guild_id: 'guild-123',
			club_uuid: 'club-123',
			challenge_id: 'challenge-archived'
		});
		expect(detail?.id).toBe('challenge-archived');
		expect(detail?.status).toBe('completed');
		expect(mod.challengeStore.detail?.completedAt).toBe('2026-03-10T17:30:00Z');
		expect(mod.challengeStore.board).toHaveLength(0);
	});

	it('keeps archived detail visible while removing it from the board', async () => {
		const mod = await import('../challenges.svelte');

		mod.challengeStore.handleFact(buildChallengeFact({ status: 'open' }));
		expect(mod.challengeStore.board).toHaveLength(1);

		mockRequest.mockResolvedValueOnce({
			challenge: buildChallengeRaw({
				id: 'challenge-1',
				status: 'accepted',
				accepted_at: '2026-03-10T13:00:00Z'
			})
		});
		await mod.challengeStore.loadDetail('challenge-1');

		mod.challengeStore.handleFact(
			buildChallengeFact({
				id: 'challenge-1',
				status: 'completed',
				accepted_at: '2026-03-10T13:00:00Z',
				completed_at: '2026-03-10T18:00:00Z'
			})
		);

		expect(mod.challengeStore.board).toHaveLength(0);
		expect(mod.challengeStore.detail?.id).toBe('challenge-1');
		expect(mod.challengeStore.detail?.status).toBe('completed');
		expect(mod.challengeStore.detail?.completedAt).toBe('2026-03-10T18:00:00Z');
	});

	it('matches pair challenges by canonical user UUID when external ids are unavailable', async () => {
		const mod = await import('../challenges.svelte');

		mod.challengeStore.handleFact(
			buildChallengeFact({
				challenger_external_id: null,
				defender_external_id: null
			})
		);

		const pairChallenge = mod.challengeStore.getPairChallenge(
			'22222222-2222-4222-8222-222222222222'
		);

		expect(pairChallenge?.id).toBe('challenge-1');
	});

	it('adds board-visible challenges and removes archived ones from facts', async () => {
		const mod = await import('../challenges.svelte');

		mod.challengeStore.handleFact(buildChallengeFact({ status: 'open' }));
		expect(mod.challengeStore.board).toHaveLength(1);
		expect(mod.challengeStore.board[0].status).toBe('open');

		mod.challengeStore.handleFact(
			buildChallengeFact({
				id: 'challenge-1',
				status: 'completed'
			})
		);
		expect(mod.challengeStore.board).toHaveLength(0);
	});

	it('blocks challenge eligibility when the current player does not have a worse tag', async () => {
		const mod = await import('../challenges.svelte');
		mockTagStore.tagList = [
			{ memberId: '11111111-1111-4111-8111-111111111111', currentTag: 3 },
			{ memberId: '22222222-2222-4222-8222-222222222222', currentTag: 8 }
		];

		const eligibility = mod.challengeStore.getChallengeEligibility(
			'22222222-2222-4222-8222-222222222222',
			8
		);

		expect(eligibility.allowed).toBe(false);
		expect(eligibility.reason).toContain('better tag');
	});

	it('publishes a manual challenge round link request with club identity and actor ids', async () => {
		const mod = await import('../challenges.svelte');

		const result = await mod.challengeStore.linkRound(
			'11111111-1111-1111-1111-111111111111',
			'22222222-2222-2222-2222-222222222222'
		);

		expect(result).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith('club.challenge.round.link.requested.v1', {
			guild_id: 'guild-123',
			club_uuid: 'club-123',
			actor_user_uuid: '11111111-1111-4111-8111-111111111111',
			actor_external_id: 'discord-user-1',
			challenge_id: '11111111-1111-1111-1111-111111111111',
			round_id: '22222222-2222-2222-2222-222222222222'
		});
	});

	it('publishes a manual challenge round link request without guild_id for club-only identities', async () => {
		mockAuth.user = {
			...mockAuth.user,
			guildId: ''
		};

		const mod = await import('../challenges.svelte');
		const result = await mod.challengeStore.linkRound(
			'11111111-1111-1111-1111-111111111111',
			'22222222-2222-2222-2222-222222222222'
		);

		expect(result).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith('club.challenge.round.link.requested.v1', {
			club_uuid: 'club-123',
			actor_user_uuid: '11111111-1111-4111-8111-111111111111',
			actor_external_id: 'discord-user-1',
			challenge_id: '11111111-1111-1111-1111-111111111111',
			round_id: '22222222-2222-2222-2222-222222222222'
		});
	});
});
