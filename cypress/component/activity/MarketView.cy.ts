/// <reference types="cypress" />

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
		cy.mountComponent(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: cy.stub().as('onPlaceBet')
			}
		});

		cy.contains('200').should('be.visible');
	});

	it('renders market options for the active tab', () => {
		cy.mountComponent(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: cy.stub().as('onPlaceBet')
			}
		});

		cy.contains('Player One').should('be.visible');
		cy.contains('Player Two').should('be.visible');
	});

	it('shows NoMarket when market prop is null', () => {
		cy.mountComponent(MarketView, {
			props: {
				market: null,
				overview: mockOverview,
				onPlaceBet: cy.stub().as('onPlaceBet')
			}
		});

		cy.contains('No upcoming rounds').should('be.visible');
	});

	it('clicking an option reveals the BetSlip', () => {
		cy.mountComponent(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: cy.stub().as('onPlaceBet')
			}
		});

		cy.contains('Player One').click();
		cy.contains('Place Bet').should('be.visible');
	});

	it('shows read-only state when readonly=true', () => {
		cy.mountComponent(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: cy.stub().as('onPlaceBet'),
				readonly: true
			}
		});

		// Locked markets should not show BetSlip
		cy.contains('Place Bet').should('not.exist');
	});

	it('shows bet error from prop', () => {
		cy.mountComponent(MarketView, {
			props: {
				market: mockMarket,
				overview: mockOverview,
				onPlaceBet: cy.stub().as('onPlaceBet'),
				betError: 'Insufficient funds'
			}
		});

		// Select an option first — BetSlip only renders its body (including the error) when an option is selected
		cy.contains('Player One').click();
		cy.contains('Insufficient funds').should('be.visible');
	});
});
