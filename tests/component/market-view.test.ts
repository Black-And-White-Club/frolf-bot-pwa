// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import MarketView from '../../src/lib/components/activity/MarketView.svelte';
import type {
	BettingMarketSnapshot,
	BettingOverview
} from '../../src/lib/stores/activity-betting.svelte';

const mockOverview: BettingOverview = {
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
} as any;

const mockMarket: BettingMarketSnapshot = {
	club_uuid: 'club-1',
	guild_id: 'guild-1',
	season_id: 'season-1',
	access_state: 'enabled',
	round: {
		id: 'round-1',
		title: 'Spring Open Round 1',
		start_time: '2099-06-01T10:00:00Z'
	},
	market: {
		id: 1,
		type: 'round_winner',
		title: 'Round Winner',
		status: 'open',
		locks_at: '2099-06-01T09:55:00Z',
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
	}
} as any;

describe('MarketView (Activity Component)', () => {
	it('renders wallet balance', () => {
		const { container } = render(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: vi.fn()
			}
		});

		expect(container.textContent).toContain('200');
	});

	it('renders market options for the active tab', () => {
		const { container } = render(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: vi.fn()
			}
		});

		expect(container.textContent).toContain('Player One');
		expect(container.textContent).toContain('Player Two');
	});
});
