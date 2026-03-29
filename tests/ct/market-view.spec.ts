import { test, expect } from '@playwright/experimental-ct-svelte';
import MarketView from '$lib/components/activity/MarketView.svelte';
import type { BettingMarketSnapshot, BettingOverview } from '$lib/stores/activity-betting.svelte';

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
} as unknown as BettingOverview;

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
} as unknown as BettingMarketSnapshot;

test.describe('MarketView (Activity Component)', () => {
	test('renders wallet balance', async ({ mount, page }) => {
		await mount(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: () => {}
			}
		});

		await expect(page.getByText('200')).toBeVisible();
	});

	test('renders market options for the active tab', async ({ mount, page }) => {
		await mount(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: () => {}
			}
		});

		await expect(page.getByText('Player One')).toBeVisible();
		await expect(page.getByText('Player Two')).toBeVisible();
	});
});
