// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../auth.svelte', () => ({
	auth: {
		bettingAccess: { key: 'betting', state: 'disabled', source: 'none' },
		user: null as { activeClubUuid?: string } | null
	}
}));

describe('BettingService', () => {
	let betting: any;
	let mockAuth: any;
	let fetchMock: ReturnType<typeof vi.fn>;

	const enabledAccess = { key: 'betting', state: 'enabled', source: 'subscription' };
	const frozenAccess = { key: 'betting', state: 'frozen', source: 'subscription' };
	const disabledAccess = { key: 'betting', state: 'disabled', source: 'none' };

	const mockOverview = {
		club_uuid: 'club-1',
		guild_id: 'guild-1',
		season_id: 'season-1',
		season_name: 'Spring 2025',
		access_state: 'enabled',
		access_source: 'subscription',
		read_only: false,
		wallet: { season_points: 100, adjustment_balance: 0, available: 100, reserved: 0 },
		settings: { opt_out_targeting: false, updated_at: '' },
		journal: []
	};

	const mockMarket = {
		id: 1,
		type: 'round_winner',
		title: 'Round Winner',
		status: 'open',
		locks_at: '2025-06-01T09:55:00Z',
		ephemeral: false,
		options: [
			{
				option_key: 'player-1',
				member_id: 'user-1',
				label: 'Player One',
				probability_percent: 60,
				decimal_odds: 1.67
			},
			{
				option_key: 'player-2',
				member_id: 'user-2',
				label: 'Player Two',
				probability_percent: 40,
				decimal_odds: 2.5
			}
		]
	};

	const mockSnapshot = {
		club_uuid: 'club-1',
		guild_id: 'guild-1',
		season_id: 'season-1',
		access_state: 'enabled',
		round: { id: 'round-1', title: 'Round 1', start_time: '2025-06-01T10:00:00Z' },
		market: mockMarket
	};

	beforeEach(async () => {
		vi.resetModules();
		fetchMock = vi.fn();
		global.fetch = fetchMock as unknown as typeof fetch;

		const authMod = await import('../auth.svelte');
		mockAuth = authMod.auth;
		mockAuth.user = { activeClubUuid: 'club-1' };
		mockAuth.bettingAccess = enabledAccess;

		const mod = await import('../betting.svelte');
		betting = mod.betting;
		betting.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('initial state', () => {
		it('starts with null data and no loading flags', () => {
			expect(betting.overview).toBeNull();
			expect(betting.nextMarket).toBeNull();
			expect(betting.loading).toBe(false);
			expect(betting.savingSettings).toBe(false);
			expect(betting.placingBet).toBe(false);
		});

		it('starts with no errors', () => {
			expect(betting.error).toBeNull();
			expect(betting.errorCode).toBeNull();
			expect(betting.actionMessage).toBeNull();
		});
	});

	describe('loadOverview', () => {
		it('fetches and stores overview on success', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockOverview
			});

			const result = await betting.loadOverview('club-1');

			expect(result).toEqual(mockOverview);
			expect(betting.overview).toEqual(mockOverview);
			expect(betting.error).toBeNull();
			expect(betting.loading).toBe(false);
		});

		it('does nothing when feature is disabled (canLoad false)', async () => {
			mockAuth.bettingAccess = disabledAccess;

			const mod = await import('../betting.svelte');
			const fresh = mod.betting;
			fresh.clear();

			const result = await fresh.loadOverview('club-1');

			expect(result).toBeNull();
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('clears overview on 403 feature_disabled', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 403,
				json: async () => ({ error: 'Feature disabled', code: 'feature_disabled' })
			});

			await betting.loadOverview('club-1');

			expect(betting.overview).toBeNull();
			expect(betting.error).toBe('Feature disabled');
			expect(betting.errorCode).toBe('feature_disabled');
		});

		it('sets error on network failure', async () => {
			fetchMock.mockRejectedValueOnce(new Error('Network down'));

			await betting.loadOverview('club-1');

			expect(betting.overview).toBeNull();
			expect(betting.error).toBe('Failed to load betting overview');
			expect(betting.errorCode).toBe('network_error');
		});

		it('returns null and sets error on invalid response shape', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ not_a_wallet: true })
			});

			const result = await betting.loadOverview('club-1');

			expect(result).toBeNull();
			expect(betting.error).toBe('Failed to load betting overview');
			expect(betting.errorCode).toBe('invalid_response');
		});

		it('deduplicates concurrent calls for the same club', async () => {
			let resolveFirst!: (v: unknown) => void;
			const firstCall = new Promise((resolve) => {
				resolveFirst = resolve;
			});

			fetchMock.mockReturnValueOnce({
				ok: true,
				status: 200,
				json: () => firstCall.then(() => mockOverview)
			});

			const p1 = betting.loadOverview('club-1');
			const p2 = betting.loadOverview('club-1');

			resolveFirst(undefined);
			await Promise.all([p1, p2]);

			expect(fetchMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('setNextMarketFromSnapshot', () => {
		it('stores a valid snapshot', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);
			expect(betting.nextMarket).toEqual(mockSnapshot);
		});

		it('clears nextMarket when null is passed', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);
			betting.setNextMarketFromSnapshot(null);
			expect(betting.nextMarket).toBeNull();
		});
	});

	describe('handleMarketLocked', () => {
		it('updates market status to locked when market id matches', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);

			betting.handleMarketLocked({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 1
			});

			expect(betting.nextMarket?.market?.status).toBe('locked');
		});

		it('does nothing when market id does not match', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);

			betting.handleMarketLocked({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 999
			});

			expect(betting.nextMarket?.market?.status).toBe('open');
		});

		it('does nothing when nextMarket is null', () => {
			expect(() =>
				betting.handleMarketLocked({
					guild_id: 'guild-1',
					club_uuid: 'club-1',
					round_id: 'round-1',
					market_id: 1
				})
			).not.toThrow();
		});
	});

	describe('handleMarketSettled', () => {
		it('updates market status to settled and sets result', async () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);

			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockOverview
			});

			betting.handleMarketSettled({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 1,
				result_summary: 'player-1 wins',
				settlement_version: 1
			});

			expect(betting.nextMarket?.market?.status).toBe('settled');
			expect(betting.nextMarket?.market?.result).toBe('player-1 wins');
		});

		it('does nothing to nextMarket when market id does not match', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);

			betting.handleMarketSettled({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 999,
				result_summary: 'irrelevant',
				settlement_version: 1
			});

			expect(betting.nextMarket?.market?.status).toBe('open');
		});
	});

	describe('handleMarketVoided', () => {
		it('clears nextMarket when market id matches', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);

			betting.handleMarketVoided({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 1,
				reason: 'round deleted'
			});

			expect(betting.nextMarket).toBeNull();
		});

		it('leaves nextMarket intact when market id does not match', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);

			betting.handleMarketVoided({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 999,
				reason: 'irrelevant'
			});

			expect(betting.nextMarket).not.toBeNull();
		});
	});

	describe('handleMarketOpened', () => {
		it('keeps existing nextMarket visible while snapshot refresh loads', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);

			betting.handleMarketOpened({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 2,
				market_type: 'round_winner'
			});

			// Snapshot stays visible until setNextMarketFromSnapshot overwrites it.
			expect(betting.nextMarket).not.toBeNull();
		});

		it('does nothing for a different club', () => {
			betting.setNextMarketFromSnapshot(mockSnapshot);

			betting.handleMarketOpened({
				guild_id: 'guild-2',
				club_uuid: 'club-2',
				round_id: 'round-1',
				market_id: 2,
				market_type: 'round_winner'
			});

			expect(betting.nextMarket).not.toBeNull();
		});
	});

	describe('updateSettings', () => {
		it('updates settings in overview on success', async () => {
			betting.overview = { ...mockOverview };
			const updatedSettings = { opt_out_targeting: true, updated_at: '2025-01-01T00:00:00Z' };

			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => updatedSettings
			});

			const result = await betting.updateSettings({ optOutTargeting: true });

			expect(result).toBe(true);
			expect(betting.overview?.settings.opt_out_targeting).toBe(true);
			expect(betting.savingSettings).toBe(false);
		});

		it('returns false and sets error on API failure', async () => {
			betting.overview = { ...mockOverview };

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: 'Bad request', code: 'bad_request' })
			});

			const result = await betting.updateSettings({ optOutTargeting: true });

			expect(result).toBe(false);
			expect(betting.error).toBe('Bad request');
		});

		it('returns false when canEdit is false (frozen state)', async () => {
			mockAuth.bettingAccess = frozenAccess;

			const mod = await import('../betting.svelte');
			const fresh = mod.betting;
			fresh.clear();

			const result = await fresh.updateSettings({ optOutTargeting: false });

			expect(result).toBe(false);
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});

	describe('placeBet', () => {
		const validInput = {
			roundId: 'round-1',
			selectionKey: 'player-1',
			stake: 50,
			marketType: 'round_winner'
		};

		it('places bet and reloads overview on success', async () => {
			const placedTicket = {
				id: 1,
				status: 'accepted',
				decimal_odds: 1.67,
				potential_payout: 83,
				settled_payout: 0,
				settled_at: null,
				created_at: new Date().toISOString(),
				market_type: 'round_winner',
				round_id: 'round-1',
				selection_key: 'player-1',
				selection_label: 'Player One',
				stake: 50
			};

			fetchMock
				.mockResolvedValueOnce({ ok: true, status: 200, json: async () => placedTicket })
				.mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockOverview });

			const result = await betting.placeBet(validInput);

			expect(result).toBe(true);
			expect(betting.actionMessage).toBe('Bet placed successfully.');
			expect(betting.placingBet).toBe(false);
			// Overview reloaded (2 fetch calls: place + reload overview)
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it('sets error on API failure', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 422,
				json: async () => ({ error: 'Insufficient balance', code: 'insufficient_balance' })
			});

			const result = await betting.placeBet(validInput);

			expect(result).toBe(false);
			expect(betting.error).toBe('Insufficient balance');
			expect(betting.errorCode).toBe('insufficient_balance');
		});

		it('returns false when canEdit is false', async () => {
			mockAuth.bettingAccess = frozenAccess;

			const mod = await import('../betting.svelte');
			const fresh = mod.betting;
			fresh.clear();

			const result = await fresh.placeBet(validInput);

			expect(result).toBe(false);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('returns false when no clubUuid', async () => {
			mockAuth.user = null;

			const mod = await import('../betting.svelte');
			const fresh = mod.betting;
			fresh.clear();

			const result = await fresh.placeBet(validInput);

			expect(result).toBe(false);
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});

	describe('clear', () => {
		it('resets all state to initial values', async () => {
			betting.overview = { ...mockOverview };
			betting.nextMarket = { ...mockSnapshot };
			betting.error = 'some error';
			betting.errorCode = 'some_code';
			betting.actionMessage = 'action done';

			betting.clear();

			expect(betting.overview).toBeNull();
			expect(betting.nextMarket).toBeNull();
			expect(betting.error).toBeNull();
			expect(betting.errorCode).toBeNull();
			expect(betting.actionMessage).toBeNull();
			expect(betting.loading).toBe(false);
			expect(betting.savingSettings).toBe(false);
			expect(betting.placingBet).toBe(false);
		});
	});

	// ---------------------------------------------------------------------------
	// Multi-market (markets[] array) tests
	// ---------------------------------------------------------------------------

	const mockMarket2 = {
		id: 2,
		type: 'placement_2nd',
		title: '2nd Place',
		status: 'open',
		locks_at: '2025-06-01T09:55:00Z',
		ephemeral: false,
		options: [
			{
				option_key: 'player-1',
				member_id: 'user-1',
				label: 'Player One',
				probability_percent: 50,
				decimal_odds: 2.0
			}
		]
	};

	const multiMarketSnapshot = {
		...mockSnapshot,
		market: mockMarket,
		markets: [mockMarket, mockMarket2]
	};

	describe('handleMarketLocked — markets array', () => {
		it('locks only the matching market in markets[]', () => {
			betting.setNextMarketFromSnapshot(multiMarketSnapshot);

			betting.handleMarketLocked({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 2
			});

			const markets = betting.nextMarket?.markets ?? [];
			const m1 = markets.find((m: { id: number }) => m.id === 1);
			const m2 = markets.find((m: { id: number }) => m.id === 2);
			expect(m1?.status).toBe('open');
			expect(m2?.status).toBe('locked');
		});

		it('also updates singular market when it matches', () => {
			betting.setNextMarketFromSnapshot(multiMarketSnapshot);

			betting.handleMarketLocked({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 1
			});

			expect(betting.nextMarket?.market?.status).toBe('locked');
		});
	});

	describe('handleMarketVoided — markets array', () => {
		it('removes voided market from markets[] but keeps others', () => {
			betting.setNextMarketFromSnapshot(multiMarketSnapshot);

			betting.handleMarketVoided({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 2,
				reason: 'cancelled'
			});

			const remaining = betting.nextMarket?.markets ?? [];
			expect(remaining).toHaveLength(1);
			expect(remaining[0].id).toBe(1);
			expect(betting.nextMarket).not.toBeNull();
		});

		it('sets nextMarket to null when the last market is voided', () => {
			// Snapshot with only a singular market (no markets array).
			betting.setNextMarketFromSnapshot(mockSnapshot);

			betting.handleMarketVoided({
				guild_id: 'guild-1',
				club_uuid: 'club-1',
				round_id: 'round-1',
				market_id: 1,
				reason: 'cancelled'
			});

			expect(betting.nextMarket).toBeNull();
		});
	});

	describe('placeBet — market_type forwarded', () => {
		it('sends market_type in POST body', async () => {
			const captured: RequestInit[] = [];
			fetchMock.mockImplementation((url: string, init: RequestInit) => {
				captured.push(init);
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => ({
						id: 99,
						status: 'accepted',
						decimal_odds: 2.0,
						potential_payout: 100,
						settled_payout: 0,
						settled_at: null,
						created_at: new Date().toISOString(),
						market_type: 'placement_2nd',
						round_id: 'round-1',
						selection_key: 'player-1',
						selection_label: 'Player One',
						stake: 50
					})
				});
			});

			await betting.placeBet({
				roundId: 'round-1',
				selectionKey: 'player-1',
				stake: 50,
				marketType: 'placement_2nd'
			});

			const body = JSON.parse(captured[0].body as string);
			expect(body.market_type).toBe('placement_2nd');
		});

		it('rejects with self_bet_prohibited and sets errorCode', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 422,
				json: async () => ({ error: 'Cannot bet on yourself', code: 'self_bet_prohibited' })
			});

			const result = await betting.placeBet({
				roundId: 'round-1',
				selectionKey: 'player-1',
				stake: 50,
				marketType: 'placement_2nd'
			});

			expect(result).toBe(false);
			expect(betting.errorCode).toBe('self_bet_prohibited');
			expect(betting.error).toBe('Cannot bet on yourself');
		});
	});
});
