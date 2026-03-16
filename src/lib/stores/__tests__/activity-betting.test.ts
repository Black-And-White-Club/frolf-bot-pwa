// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/config', () => ({
	config: { api: { url: 'http://localhost:8080' } }
}));

describe('extractClubUuidFromTicket', () => {
	let extractClubUuidFromTicket: (ticket: string) => string | null;

	beforeEach(async () => {
		vi.resetModules();
		const mod = await import('../activity-betting.svelte');
		extractClubUuidFromTicket = mod.extractClubUuidFromTicket;
	});

	function makeJwt(payload: object): string {
		const encoded = btoa(JSON.stringify(payload))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
		return `header.${encoded}.sig`;
	}

	it('extracts active_club_uuid from a valid JWT payload', () => {
		const ticket = makeJwt({ active_club_uuid: 'club-abc', sub: 'user-1' });
		expect(extractClubUuidFromTicket(ticket)).toBe('club-abc');
	});

	it('returns null when active_club_uuid is absent', () => {
		const ticket = makeJwt({ sub: 'user-1' });
		expect(extractClubUuidFromTicket(ticket)).toBeNull();
	});

	it('returns null for malformed token', () => {
		expect(extractClubUuidFromTicket('not.a')).toBeNull();
		expect(extractClubUuidFromTicket('only-one-segment')).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(extractClubUuidFromTicket('')).toBeNull();
	});
});

describe('ActivityBettingService', () => {
	let ActivityBettingService: any;
	let svc: any;
	let fetchMock: ReturnType<typeof vi.fn>;

	const mockHeader = () => ({ Authorization: 'Bearer test-token' });

	const mockOverview = {
		club_uuid: 'club-1',
		guild_id: 'guild-1',
		season_id: 'season-1',
		season_name: 'Spring 2025',
		access_state: 'enabled',
		access_source: 'subscription',
		read_only: false,
		wallet: { season_points: 200, adjustment_balance: 0, available: 200, reserved: 0 },
		settings: { opt_out_targeting: false, updated_at: '' },
		journal: []
	};

	beforeEach(async () => {
		vi.resetModules();
		fetchMock = vi.fn();
		global.fetch = fetchMock as unknown as typeof fetch;
		const mod = await import('../activity-betting.svelte');
		ActivityBettingService = mod.ActivityBettingService;
		svc = new ActivityBettingService(mockHeader);
	});

	describe('canEdit / canView', () => {
		it('canEdit is true only when access_state is enabled', () => {
			svc.overview = { ...mockOverview, access_state: 'enabled' };
			expect(svc.canEdit).toBe(true);
			svc.overview = { ...mockOverview, access_state: 'frozen' };
			expect(svc.canEdit).toBe(false);
		});

		it('canView is true for enabled or frozen', () => {
			svc.overview = { ...mockOverview, access_state: 'enabled' };
			expect(svc.canView).toBe(true);
			svc.overview = { ...mockOverview, access_state: 'frozen' };
			expect(svc.canView).toBe(true);
			svc.overview = { ...mockOverview, access_state: 'disabled' };
			expect(svc.canView).toBe(false);
		});
	});

	describe('loadOverview', () => {
		it('sets overview on success', async () => {
			fetchMock.mockResolvedValueOnce({ ok: true, json: async () => mockOverview });

			await svc.loadOverview('club-1');

			expect(svc.overview).toEqual(mockOverview);
			expect(svc.loading).toBe(false);
			expect(svc.error).toBeNull();
		});

		it('sets error on non-ok response', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 403,
				json: async () => ({ code: 'access_denied', error: 'Forbidden' })
			});

			await svc.loadOverview('club-1');

			expect(svc.error).toBe('Forbidden');
			expect(svc.errorCode).toBe('access_denied');
			expect(svc.overview).toBeNull();
		});

		it('sets network error on fetch failure', async () => {
			fetchMock.mockRejectedValueOnce(new Error('timeout'));

			await svc.loadOverview('club-1');

			expect(svc.error).toBe('Failed to load betting overview');
			expect(svc.errorCode).toBe('network_error');
		});

		it('does nothing when clubUuid is empty', async () => {
			await svc.loadOverview('');
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});

	describe('placeBet', () => {
		it('returns true and reloads overview on success', async () => {
			svc.overview = { ...mockOverview, access_state: 'enabled' };
			fetchMock
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) }) // placeBet
				.mockResolvedValueOnce({ ok: true, json: async () => mockOverview }); // loadOverview

			const result = await svc.placeBet('club-1', {
				roundId: 'r1',
				selectionKey: 'player-1',
				stake: 50,
				marketType: 'round_winner'
			});

			expect(result).toBe(true);
			expect(svc.actionMessage).toBe('Bet placed successfully.');
		});

		it('returns false when canEdit is false', async () => {
			svc.overview = { ...mockOverview, access_state: 'frozen' };

			const result = await svc.placeBet('club-1', {
				roundId: 'r1',
				selectionKey: 'player-1',
				stake: 50,
				marketType: 'round_winner'
			});

			expect(result).toBe(false);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('sets error on non-ok API response', async () => {
			svc.overview = { ...mockOverview, access_state: 'enabled' };
			fetchMock.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ code: 'insufficient_funds', error: 'Not enough points' })
			});

			const result = await svc.placeBet('club-1', {
				roundId: 'r1',
				selectionKey: 'player-1',
				stake: 9999,
				marketType: 'round_winner'
			});

			expect(result).toBe(false);
			expect(svc.error).toBe('Not enough points');
			expect(svc.errorCode).toBe('insufficient_funds');
		});
	});

	describe('NATS event handlers', () => {
		it('handleMarketSettled sets lastSettled', async () => {
			fetchMock.mockResolvedValue({ ok: true, json: async () => mockOverview });
			const payload = { club_uuid: 'club-1', market_id: 1, result_summary: 'Player 1 wins' };
			svc.handleMarketSettled(payload as any, 'club-1');
			expect(svc.lastSettled).toEqual(payload);
		});

		it('handleMarketSettled ignores other clubs', () => {
			const payload = { club_uuid: 'club-other', market_id: 1 };
			svc.handleMarketSettled(payload as any, 'club-1');
			expect(svc.lastSettled).toBeNull();
		});

		it('handleMarketOpened clears lastSettled and reloads', async () => {
			fetchMock.mockResolvedValue({ ok: true, json: async () => mockOverview });
			svc.lastSettled = { club_uuid: 'club-1' } as any;
			svc.nextMarket = { market: { id: 5 } } as any;

			svc.handleMarketOpened({ club_uuid: 'club-1' } as any, 'club-1');

			expect(svc.lastSettled).toBeNull();
			expect(svc.nextMarket).toBeNull();
		});

		it('handleMarketLocked updates market status in nextMarket', () => {
			svc.nextMarket = {
				club_uuid: 'club-1',
				market: { id: 7, status: 'open' }
			} as any;

			svc.handleMarketLocked({ club_uuid: 'club-1', market_id: 7 } as any, 'club-1');

			expect(svc.nextMarket?.market?.status).toBe('locked');
		});

		it('handleMarketLocked ignores mismatched market id', () => {
			svc.nextMarket = { club_uuid: 'club-1', market: { id: 7, status: 'open' } } as any;

			svc.handleMarketLocked({ club_uuid: 'club-1', market_id: 99 } as any, 'club-1');

			expect(svc.nextMarket?.market?.status).toBe('open');
		});
	});

	describe('clear', () => {
		it('resets all state', () => {
			svc.overview = mockOverview as any;
			svc.error = 'some error';
			svc.actionMessage = 'done';

			svc.clear();

			expect(svc.overview).toBeNull();
			expect(svc.error).toBeNull();
			expect(svc.actionMessage).toBeNull();
			expect(svc.lastSettled).toBeNull();
		});
	});
});
