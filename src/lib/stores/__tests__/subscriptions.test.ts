// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SubscriptionMessage = {
	subject: string;
	data: unknown;
	headers?: Map<string, string[]>;
};

type SubscriptionHandler = (msg: SubscriptionMessage) => void;

const subscriptions = new Map<string, SubscriptionHandler>();

const mockNats = {
	subscribe: vi.fn((subject: string, handler: SubscriptionHandler) => {
		subscriptions.set(subject, handler);
		return () => {
			subscriptions.delete(subject);
		};
	})
};

const mockRoundService = {
	handleRoundCreated: vi.fn(),
	handleRoundUpdated: vi.fn(),
	handleRoundDeleted: vi.fn(),
	handleScoresSnapshot: vi.fn(),
	handleScoreUpdated: vi.fn(),
	removeParticipant: vi.fn()
};

const mockParticipantFromRaw = vi.fn((raw: any) => ({
	userId: raw.user_id,
	response: raw.response,
	score: raw.score ?? null,
	tagNumber: raw.tag_number ?? null,
	...(raw.raw_name ? { rawName: raw.raw_name } : {}),
	...(raw.hole_scores ? { scores: raw.hole_scores } : {}),
	...(raw.is_dnf ? { isDNF: true } : {})
}));

const mockLeaderboardService = {
	applyPatch: vi.fn()
};

const mockTagStore = {
	upsertTagMember: vi.fn(),
	swapTagMembers: vi.fn()
};

const mockDataLoader = {
	reload: vi.fn(async () => {}),
	refreshBettingSnapshot: vi.fn(async () => {})
};

const mockRoundActionsService = {
	reconcileRound: vi.fn()
};

vi.mock('../nats.svelte', () => ({
	nats: mockNats
}));

vi.mock('../round.svelte', () => ({
	participantFromRaw: mockParticipantFromRaw,
	roundService: mockRoundService
}));

vi.mock('../leaderboard.svelte', () => ({
	leaderboardService: mockLeaderboardService
}));

vi.mock('../tags.svelte', () => ({
	tagStore: mockTagStore
}));

vi.mock('../dataLoader.svelte', () => ({
	dataLoader: mockDataLoader
}));

vi.mock('../roundActions.svelte', () => ({
	roundActionsService: mockRoundActionsService
}));

const mockBetting = {
	handleMarketOpened: vi.fn(),
	handleMarketLocked: vi.fn(),
	handleMarketSettled: vi.fn(),
	handleMarketVoided: vi.fn()
};

vi.mock('../betting.svelte', () => ({
	betting: mockBetting
}));

vi.mock('../challenges.svelte', () => ({
	challengeStore: { handleFact: vi.fn() }
}));

const mockAuth = {
	updateEntitlements: vi.fn()
};

vi.mock('../auth.svelte', () => ({
	auth: mockAuth
}));

function emit(subject: string, data: unknown): void {
	const handler = subscriptions.get(subject);
	if (!handler) {
		throw new Error(`No subscription registered for ${subject}`);
	}

	handler({ subject, data, headers: new Map() });
}

describe('subscriptionManager', () => {
	const wireRoundId = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
	const normalizedRoundId = '00010203-0405-0607-0809-0a0b0c0d0e0f';

	beforeEach(async () => {
		const { subscriptionManager } = await import('../subscriptions.svelte');
		subscriptionManager.stop();

		subscriptions.clear();
		mockNats.subscribe.mockReset();
		mockNats.subscribe.mockImplementation((subject: string, handler: SubscriptionHandler) => {
			subscriptions.set(subject, handler);
			return () => {
				subscriptions.delete(subject);
			};
		});

		mockRoundService.handleRoundCreated.mockReset();
		mockRoundService.handleRoundUpdated.mockReset();
		mockRoundService.handleRoundDeleted.mockReset();
		mockRoundService.handleScoresSnapshot.mockReset();
		mockRoundService.handleScoreUpdated.mockReset();
		mockRoundService.removeParticipant.mockReset();
		mockParticipantFromRaw.mockClear();
		mockLeaderboardService.applyPatch.mockReset();
		mockTagStore.upsertTagMember.mockReset();
		mockTagStore.swapTagMembers.mockReset();
		mockDataLoader.reload.mockReset();
		mockDataLoader.reload.mockResolvedValue(undefined);
		mockDataLoader.refreshBettingSnapshot.mockReset();
		mockDataLoader.refreshBettingSnapshot.mockResolvedValue(undefined);
		mockRoundActionsService.reconcileRound.mockReset();
		mockBetting.handleMarketOpened.mockReset();
		mockBetting.handleMarketLocked.mockReset();
		mockBetting.handleMarketSettled.mockReset();
		mockBetting.handleMarketVoided.mockReset();
		mockAuth.updateEntitlements.mockReset();

		subscriptionManager.start('guild-1');
	});

	it('reloads round data when round.updated.v2 only includes round identity', () => {
		emit('round.updated.v2.guild-1', {
			guild_id: 'guild-1',
			round_id: wireRoundId
		});

		expect(mockDataLoader.reload).toHaveBeenCalledTimes(1);
		expect(mockRoundActionsService.reconcileRound).toHaveBeenCalledWith(
			normalizedRoundId,
			'round-updated'
		);
		expect(mockRoundService.handleRoundUpdated).not.toHaveBeenCalled();
	});

	it('normalizes round.updated.v2 round ids when an inline update is present', () => {
		emit('round.updated.v2.guild-1', {
			guild_id: 'guild-1',
			round_id: wireRoundId,
			update: {
				title: 'Updated title'
			}
		});

		expect(mockRoundService.handleRoundUpdated).toHaveBeenCalledWith({
			roundId: normalizedRoundId,
			update: {
				title: 'Updated title'
			}
		});
		expect(mockRoundActionsService.reconcileRound).toHaveBeenCalledWith(
			normalizedRoundId,
			'round-updated'
		);
		expect(mockDataLoader.reload).not.toHaveBeenCalled();
	});

	it('removes a single participant when round.participant.removed.v2 omits snapshots', () => {
		emit('round.participant.removed.v2.guild-1', {
			guild_id: 'guild-1',
			round_id: wireRoundId,
			user_id: 'user-123',
			discord_message_id: 'message-1'
		});

		expect(mockRoundService.removeParticipant).toHaveBeenCalledWith(normalizedRoundId, 'user-123');
		expect(mockRoundActionsService.reconcileRound).toHaveBeenCalledWith(
			normalizedRoundId,
			'participant-updated'
		);
		expect(mockRoundService.handleRoundUpdated).not.toHaveBeenCalled();
	});

	it('treats explicit empty removal snapshots as a valid participant snapshot update', () => {
		emit('round.participant.removed.v2.guild-1', {
			guild_id: 'guild-1',
			round_id: wireRoundId,
			user_id: 'user-123',
			discord_message_id: 'message-1',
			accepted_participants: [],
			declined_participants: [],
			tentative_participants: []
		});

		expect(mockRoundService.handleRoundUpdated).toHaveBeenCalledWith({
			roundId: normalizedRoundId,
			update: { participants: [] }
		});
		expect(mockRoundService.removeParticipant).not.toHaveBeenCalled();
	});

	describe('betting event subscriptions', () => {
		it('calls handleMarketOpened and refreshBettingSnapshot (not reload) on market generated', () => {
			const payload = { market_id: 'mkt-1', round_id: 'round-1', club_uuid: 'guild-1' };
			emit('betting.market.generated.v1.guild-1', payload);

			expect(mockBetting.handleMarketOpened).toHaveBeenCalledWith(payload);
			expect(mockDataLoader.refreshBettingSnapshot).toHaveBeenCalledTimes(1);
			expect(mockDataLoader.reload).not.toHaveBeenCalled();
		});

		it('calls handleMarketLocked on market locked', () => {
			const payload = { market_id: 'mkt-1', club_uuid: 'guild-1' };
			emit('betting.market.locked.v1.guild-1', payload);

			expect(mockBetting.handleMarketLocked).toHaveBeenCalledWith(payload);
			expect(mockDataLoader.refreshBettingSnapshot).not.toHaveBeenCalled();
		});

		it('calls handleMarketSettled on market settled', () => {
			const payload = { market_id: 'mkt-1', club_uuid: 'guild-1', winners: [] };
			emit('betting.market.settled.v1.guild-1', payload);

			expect(mockBetting.handleMarketSettled).toHaveBeenCalledWith(payload);
			expect(mockDataLoader.refreshBettingSnapshot).not.toHaveBeenCalled();
		});

		it('calls handleMarketVoided on market voided', () => {
			const payload = { market_id: 'mkt-1', club_uuid: 'guild-1', reason: 'cancelled' };
			emit('betting.market.voided.v1.guild-1', payload);

			expect(mockBetting.handleMarketVoided).toHaveBeenCalledWith(payload);
			expect(mockDataLoader.refreshBettingSnapshot).not.toHaveBeenCalled();
		});
	});

	describe('entitlement event subscriptions', () => {
		it('calls auth.updateEntitlements with new entitlements on feature access update', () => {
			const entitlements = {
				resolved_at: '2024-01-15T10:00:00Z',
				features: {
					betting: { key: 'betting', state: 'enabled', source: 'subscription' }
				}
			};
			emit('guild.feature_access.updated.v1.guild-1', {
				guild_id: 'guild-1',
				entitlements
			});

			expect(mockAuth.updateEntitlements).toHaveBeenCalledWith(entitlements);
		});

		it('propagates frozen state from entitlement event', () => {
			const entitlements = {
				resolved_at: '2024-01-15T10:00:00Z',
				features: {
					betting: {
						key: 'betting',
						state: 'frozen',
						source: 'manual_deny',
						reason: 'Payment overdue'
					}
				}
			};
			emit('guild.feature_access.updated.v1.guild-1', {
				guild_id: 'guild-1',
				entitlements
			});

			expect(mockAuth.updateEntitlements).toHaveBeenCalledWith(entitlements);
		});

		it('propagates disabled state from entitlement event', () => {
			const entitlements = {
				resolved_at: '2024-01-15T10:00:00Z',
				features: {
					betting: { key: 'betting', state: 'disabled', source: 'none' }
				}
			};
			emit('guild.feature_access.updated.v1.guild-1', {
				guild_id: 'guild-1',
				entitlements
			});

			expect(mockAuth.updateEntitlements).toHaveBeenCalledWith(entitlements);
		});

		it('does not call dataLoader or betting handlers on entitlement update', () => {
			emit('guild.feature_access.updated.v1.guild-1', {
				guild_id: 'guild-1',
				entitlements: { features: {} }
			});

			expect(mockDataLoader.reload).not.toHaveBeenCalled();
			expect(mockDataLoader.refreshBettingSnapshot).not.toHaveBeenCalled();
			expect(mockBetting.handleMarketOpened).not.toHaveBeenCalled();
		});
	});
});
