// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BettingPage from './+page.svelte';
import type {
	BettingMarketSnapshot,
	BettingOverview,
	BettingMemberSettings,
	BettingWalletSnapshot
} from '$lib/stores/betting.svelte';

const { mockBettingStore, mockAuth, mockClubService } = vi.hoisted(() => {
	const updateSettings = vi.fn();
	const placeBet = vi.fn();
	const loadOverview = vi.fn();
	const clear = vi.fn();

	return {
		mockBettingStore: {
			overview: null as BettingOverview | null,
			nextMarket: null as BettingMarketSnapshot | null,
			loading: false,
			placingBet: false,
			savingSettings: false,
			error: null as string | null,
			errorCode: null as string | null,
			actionMessage: null as string | null,
			currentClubUuid: null as string | null,
			updateSettings,
			placeBet,
			loadOverview,
			clear
		},
		mockAuth: {
			user: { activeClubUuid: 'club-abc' } as { activeClubUuid?: string } | null,
			bettingAccess: { key: 'betting', state: 'enabled', source: 'subscription' }
		},
		mockClubService: {
			activeClub: { uuid: 'club-abc' }
		}
	};
});

vi.mock('$lib/stores/betting.svelte', () => ({ betting: mockBettingStore }));
vi.mock('$lib/stores/auth.svelte', () => ({ auth: mockAuth }));
vi.mock('$lib/stores/club.svelte', () => ({ clubService: mockClubService }));

const baseWallet: BettingWalletSnapshot = {
	season_points: 2000,
	adjustment_balance: -100,
	available: 1500,
	reserved: 50
};

const baseSettings: BettingMemberSettings = {
	opt_out_targeting: false,
	updated_at: ''
};

const baseOverview: BettingOverview = {
	club_uuid: 'club-abc',
	guild_id: 'guild-1',
	season_id: 'season-1',
	season_name: 'Season 1',
	access_state: 'enabled',
	access_source: 'subscription',
	read_only: false,
	wallet: baseWallet,
	settings: baseSettings,
	journal: []
};

const baseMarketSnapshot: BettingMarketSnapshot = {
	club_uuid: 'club-abc',
	guild_id: 'guild-1',
	season_id: 'season-1',
	access_state: 'enabled',
	round: {
		id: 'round-1',
		title: 'Spring Round 1',
		start_time: '2025-08-01T09:00:00Z'
	},
	market: {
		id: 42,
		type: 'round_winner',
		title: 'Round Winner',
		status: 'open',
		locks_at: '2025-08-01T09:55:00Z',
		ephemeral: false,
		options: [
			{
				option_key: 'player-1',
				member_id: 'user-1',
				label: 'Alice Smith',
				decimal_odds: 2.5,
				probability_percent: 40
			},
			{
				option_key: 'player-2',
				member_id: 'user-2',
				label: 'Bob Jones',
				decimal_odds: 3.0,
				probability_percent: 33
			}
		]
	}
};

describe('Betting page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockBettingStore.overview = null;
		mockBettingStore.nextMarket = null;
		mockBettingStore.loading = false;
		mockBettingStore.placingBet = false;
		mockBettingStore.savingSettings = false;
		mockBettingStore.error = null;
		mockBettingStore.errorCode = null;
		mockBettingStore.actionMessage = null;
		mockBettingStore.currentClubUuid = null;
		mockAuth.user = { activeClubUuid: 'club-abc' };
		mockAuth.bettingAccess = { key: 'betting', state: 'enabled', source: 'subscription' };
		mockBettingStore.updateSettings.mockResolvedValue(true);
		mockBettingStore.placeBet.mockResolvedValue(true);
		mockBettingStore.loadOverview.mockResolvedValue(null);
		mockBettingStore.clear.mockReturnValue(undefined);
	});

	it('shows disabled state when access is disabled', () => {
		mockAuth.bettingAccess = { key: 'betting', state: 'disabled', source: 'none' };
		const { getByText } = render(BettingPage);
		expect(getByText('Betting Locked')).toBeTruthy();
	});

	it('shows frozen state when access is frozen', () => {
		mockAuth.bettingAccess = { key: 'betting', state: 'frozen', source: 'subscription' };
		const { getByText } = render(BettingPage);
		expect(getByText('Betting Frozen')).toBeTruthy();
	});

	it('shows enabled state when access is enabled', () => {
		const { getByText } = render(BettingPage);
		expect(getByText('Betting Enabled')).toBeTruthy();
	});

	it('shows wallet balance from overview', () => {
		mockBettingStore.overview = { ...baseOverview, wallet: { ...baseWallet, available: 1500 } };
		const { getAllByText } = render(BettingPage);
		// available balance is shown as "1,500 pts" in the wallet section
		expect(getAllByText(/1,500 pts/).length).toBeGreaterThan(0);
	});

	it('shows round title when market snapshot has round', () => {
		mockBettingStore.nextMarket = baseMarketSnapshot;
		const { getByText } = render(BettingPage);
		expect(getByText('Spring Round 1')).toBeTruthy();
	});

	it('shows market options for open market', () => {
		mockBettingStore.nextMarket = baseMarketSnapshot;
		const { getAllByText } = render(BettingPage);
		expect(getAllByText('Alice Smith').length).toBeGreaterThan(0);
		expect(getAllByText('Bob Jones').length).toBeGreaterThan(0);
	});

	it('shows locked status badge when market is locked', () => {
		mockBettingStore.nextMarket = {
			...baseMarketSnapshot,
			market: { ...baseMarketSnapshot.market!, status: 'locked' }
		};
		const { getByText } = render(BettingPage);
		expect(getByText(/locked/i)).toBeTruthy();
	});

	it('auto-selects first option and enables place bet button', async () => {
		mockBettingStore.nextMarket = baseMarketSnapshot;
		const { getByRole } = render(BettingPage);
		// $effect auto-selects the first option when market opens
		await waitFor(() => {
			const btn = getByRole('button', { name: /place bet/i });
			expect((btn as HTMLButtonElement).disabled).toBe(false);
		});
	});

	it('calls placeBet with selected option and stake', async () => {
		mockBettingStore.nextMarket = baseMarketSnapshot;
		mockBettingStore.overview = baseOverview;
		const { getAllByRole, getByRole } = render(BettingPage);

		// select first radio
		const radios = getAllByRole('radio');
		await fireEvent.click(radios[0]);

		const btn = getByRole('button', { name: /place bet/i });
		await fireEvent.click(btn);

		await waitFor(() => {
			expect(mockBettingStore.placeBet).toHaveBeenCalledWith({
				roundId: 'round-1',
				selectionKey: 'player-1',
				stake: expect.any(Number),
				marketType: expect.any(String)
			});
		});
	});

	it('shows error message when bet placement fails with invalid_stake', async () => {
		mockBettingStore.error = 'Stake must be at least 10 points.';
		mockBettingStore.errorCode = 'invalid_stake';
		mockBettingStore.nextMarket = baseMarketSnapshot;
		const { getAllByText } = render(BettingPage);
		expect(getAllByText('Stake must be at least 10 points.').length).toBeGreaterThan(0);
	});

	it('shows journal entries from overview', () => {
		mockBettingStore.overview = {
			...baseOverview,
			journal: [
				{
					id: 1,
					amount: -50,
					entry_type: 'bet_placed',
					reason: 'bet placed',
					created_at: '2025-06-01T10:00:00Z'
				}
			]
		};
		const { getByText } = render(BettingPage);
		expect(getByText(/-50 pts/)).toBeTruthy();
	});

	it('does not show market section when nextMarket is null', () => {
		mockBettingStore.nextMarket = null;
		const { queryByText } = render(BettingPage);
		expect(queryByText('Alice Smith')).toBeNull();
	});

	it('shows settings panel when overview is available and access is enabled', () => {
		mockBettingStore.overview = baseOverview;
		const { getByLabelText } = render(BettingPage);
		expect(getByLabelText(/opt.?out/i)).toBeTruthy();
	});

	it('disables settings when access is frozen', () => {
		mockAuth.bettingAccess = { key: 'betting', state: 'frozen', source: 'subscription' };
		mockBettingStore.overview = { ...baseOverview, read_only: true };
		const { getByLabelText } = render(BettingPage);
		const toggle = getByLabelText(/opt.?out/i) as HTMLInputElement;
		expect(toggle.disabled).toBe(true);
	});

	// ---------------------------------------------------------------------------
	// Multi-market tab tests
	// ---------------------------------------------------------------------------

	const multiMarketSnapshot: BettingMarketSnapshot = {
		club_uuid: 'club-abc',
		guild_id: 'guild-1',
		season_id: 'season-1',
		access_state: 'enabled',
		round: { id: 'round-1', title: 'Spring Round 1', start_time: '2025-08-01T09:00:00Z' },
		market: {
			id: 1,
			type: 'round_winner',
			title: 'Round Winner',
			status: 'open',
			locks_at: '2025-08-01T09:55:00Z',
			ephemeral: false,
			options: [
				{
					option_key: 'player-1',
					member_id: 'user-1',
					label: 'Alice Smith',
					decimal_odds: 2.5,
					probability_percent: 40
				}
			]
		},
		markets: [
			{
				id: 1,
				type: 'round_winner',
				title: 'Round Winner',
				status: 'open',
				locks_at: '2025-08-01T09:55:00Z',
				ephemeral: false,
				options: [
					{
						option_key: 'player-1',
						member_id: 'user-1',
						label: 'Alice Smith',
						decimal_odds: 2.5,
						probability_percent: 40
					}
				]
			},
			{
				id: 2,
				type: 'placement_2nd',
				title: 'Spring Round 1 2nd place',
				status: 'open',
				locks_at: '2025-08-01T09:55:00Z',
				ephemeral: false,
				options: [
					{
						option_key: 'player-1',
						member_id: 'user-1',
						label: 'Alice Smith',
						decimal_odds: 2.5,
						probability_percent: 40,
						self_bet_restricted: true
					},
					{
						option_key: 'player-2',
						member_id: 'user-2',
						label: 'Bob Jones',
						decimal_odds: 3.0,
						probability_percent: 33
					}
				]
			},
			{
				id: 3,
				type: 'over_under',
				title: 'Spring Round 1 score over/under',
				status: 'open',
				locks_at: '2025-08-01T09:55:00Z',
				ephemeral: false,
				options: [
					{
						option_key: 'player-1_over',
						member_id: 'user-1',
						label: 'Alice Over 52',
						decimal_odds: 1.9,
						probability_percent: 52,
						self_bet_restricted: true
					},
					{
						option_key: 'player-1_under',
						member_id: 'user-1',
						label: 'Alice Under 52',
						decimal_odds: 2.1,
						probability_percent: 48,
						self_bet_restricted: true
					}
				]
			}
		]
	};

	describe('Market tabs', () => {
		it('shows Winner, Placement, and Score O/U tab buttons when all markets present', () => {
			mockBettingStore.nextMarket = multiMarketSnapshot;
			const { getByRole } = render(BettingPage);
			expect(getByRole('button', { name: 'Winner' })).toBeTruthy();
			expect(getByRole('button', { name: 'Placement' })).toBeTruthy();
			expect(getByRole('button', { name: 'Score O/U' })).toBeTruthy();
		});

		it('Placement tab is disabled when no placement markets exist', () => {
			mockBettingStore.nextMarket = {
				...multiMarketSnapshot,
				markets: [
					multiMarketSnapshot.markets![0], // winner only
					multiMarketSnapshot.markets![2] // over_under only
				]
			};
			const { getByRole } = render(BettingPage);
			const placementBtn = getByRole('button', { name: 'Placement' }) as HTMLButtonElement;
			expect(placementBtn.disabled).toBe(true);
		});

		it('clicking Placement tab shows placement sub-tab buttons', async () => {
			mockBettingStore.nextMarket = multiMarketSnapshot;
			const { getByRole, queryByRole } = render(BettingPage);

			await fireEvent.click(getByRole('button', { name: 'Placement' }));

			await waitFor(() => {
				expect(queryByRole('button', { name: /2nd place/i })).toBeTruthy();
			});
		});

		it('shows "Selection" column header on Score O/U tab', async () => {
			mockBettingStore.nextMarket = multiMarketSnapshot;
			const { getByRole, queryByText } = render(BettingPage);

			await fireEvent.click(getByRole('button', { name: 'Score O/U' }));

			await waitFor(() => {
				expect(queryByText('Selection')).toBeTruthy();
			});
		});

		it('shows over/under option labels on Score O/U tab', async () => {
			mockBettingStore.nextMarket = multiMarketSnapshot;
			const { getByRole, getAllByText } = render(BettingPage);

			await fireEvent.click(getByRole('button', { name: 'Score O/U' }));

			await waitFor(() => {
				expect(getAllByText('Alice Over 52').length).toBeGreaterThan(0);
				expect(getAllByText('Alice Under 52').length).toBeGreaterThan(0);
			});
		});
	});

	describe('Self-bet UI', () => {
		it('disables radio for self_bet_restricted options on placement market', async () => {
			mockBettingStore.nextMarket = multiMarketSnapshot;
			const { getByRole, getAllByRole } = render(BettingPage);

			await fireEvent.click(getByRole('button', { name: 'Placement' }));

			await waitFor(() => {
				const radios = getAllByRole('radio') as HTMLInputElement[];
				// player-1 option has self_bet_restricted: true — its radio should be disabled
				const restricted = radios.find((r) => r.value === 'player-1');
				expect(restricted).toBeTruthy();
				expect(restricted!.disabled).toBe(true);
			});
		});

		it('shows "Can\'t bet on yourself" text for self_bet_restricted options', async () => {
			mockBettingStore.nextMarket = multiMarketSnapshot;
			const { getByRole, queryByText } = render(BettingPage);

			await fireEvent.click(getByRole('button', { name: 'Placement' }));

			await waitFor(() => {
				expect(queryByText(/can't bet on yourself/i)).toBeTruthy();
			});
		});

		it('winner market options are NOT restricted even with same member_id', () => {
			mockBettingStore.nextMarket = multiMarketSnapshot;
			const { getAllByRole } = render(BettingPage);
			// Winner tab is the default — no options should be restricted
			const radios = getAllByRole('radio') as HTMLInputElement[];
			for (const radio of radios) {
				expect(radio.disabled).toBe(false);
			}
		});
	});
});
