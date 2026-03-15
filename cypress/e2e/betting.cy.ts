/// <reference types="cypress" />
import { bettingScreen } from '../screens/betting.screen';
import { navScreen } from '../screens/nav.screen';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';

describe('Betting Feature', () => {
	const subjectId = 'club-betting-1';
	const guildId = 'guild-betting-1';

	const enabledEntitlements = {
		features: {
			betting: { key: 'betting', state: 'enabled' as const, source: 'subscription', reason: '' }
		}
	};

	const frozenEntitlements = {
		features: {
			betting: {
				key: 'betting',
				state: 'frozen' as const,
				source: 'manual_deny',
				reason: 'Payment lapsed'
			}
		}
	};

	const mockOverview = {
		club_uuid: subjectId,
		guild_id: guildId,
		season_id: 'season-2025',
		season_name: 'Spring 2025',
		access_state: 'enabled',
		access_source: 'subscription',
		read_only: false,
		wallet: { season_points: 150, adjustment_balance: 10, available: 140, reserved: 10 },
		settings: { opt_out_targeting: false, updated_at: '' },
		journal: [
			{
				id: 1,
				entry_type: 'stake_reserve',
				amount: -10,
				reason: 'Stake reserve for round winner market',
				created_at: new Date().toISOString()
			}
		]
	};

	// BettingMarketSnapshot shape — club-wide, no per-user data
	const mockMarketSnapshot = {
		club_uuid: subjectId,
		guild_id: guildId,
		season_id: 'season-2025',
		access_state: 'enabled',
		round: {
			id: 'round-bet-1',
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
	};

	const mockMarketSnapshotFrozen = {
		...mockMarketSnapshot,
		access_state: 'frozen',
		market: undefined
	} as unknown as typeof mockMarketSnapshot;

	function arrangeBaseSnapshot() {
		cy.arrangeSnapshot({
			subjectId,
			rounds: [
				buildRoundCreated({
					id: 'round-bet-1',
					guild_id: guildId,
					title: 'Spring Open Round 1',
					state: 'scheduled',
					participants: []
				})
			],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: guildId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 1, total_points: 150, rounds_played: 5 },
					{ user_id: 'user-2', tag_number: 2, total_points: 120, rounds_played: 4 }
				]
			}),
			tags: buildTagListSnapshot({
				guild_id: guildId,
				members: [
					{ member_id: 'user-1', current_tag: 1 },
					{ member_id: 'user-2', current_tag: 2 }
				]
			}),
			profiles: {
				'user-1': {
					user_id: 'user-1',
					display_name: 'Player One',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
				},
				'user-2': {
					user_id: 'user-2',
					display_name: 'Player Two',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
				}
			}
		});
	}

	function stubBettingSnapshot(snapshot = mockMarketSnapshot) {
		cy.wsStubRequest(`betting.snapshot.request.v1.${subjectId}`, snapshot, { validate: false });
	}

	function interceptBettingOverview(overrideBody?: object) {
		cy.intercept('GET', '**/api/betting/overview*', {
			statusCode: 200,
			body: overrideBody ?? mockOverview
		}).as('bettingOverview');
	}

	function visitBettingEnabled() {
		arrangeBaseSnapshot();
		stubBettingSnapshot();
		interceptBettingOverview();
		cy.arrangeAuth({
			path: '/betting',
			clubUuid: subjectId,
			guildId,
			role: 'player',
			linkedProviders: ['discord'],
			entitlements: enabledEntitlements
		});
		cy.wsConnect();
	}

	function visitBettingFrozen() {
		arrangeBaseSnapshot();
		stubBettingSnapshot(mockMarketSnapshotFrozen as typeof mockMarketSnapshot);
		interceptBettingOverview({ ...mockOverview, access_state: 'frozen', read_only: true });
		cy.arrangeAuth({
			path: '/betting',
			clubUuid: subjectId,
			guildId,
			role: 'player',
			linkedProviders: ['discord'],
			entitlements: frozenEntitlements
		});
		cy.wsConnect();
	}

	describe('enabled state', () => {
		it('shows the enabled access badge', () => {
			visitBettingEnabled();
			cy.wait('@bettingOverview');

			bettingScreen.accessBadge().should('contain.text', 'enabled');
		});

		it('renders wallet stats after data loads', () => {
			visitBettingEnabled();
			cy.wait('@bettingOverview');

			cy.contains('Available Wallet').should('be.visible');
			cy.contains('Season Mirror').should('be.visible');
			cy.contains('Ledger Delta').should('be.visible');
		});

		it('renders the next market section with player options from NATS snapshot', () => {
			visitBettingEnabled();
			cy.wait('@bettingOverview');

			cy.contains('Next Market').should('be.visible');
			cy.contains('Player One').should('be.visible');
			cy.contains('Player Two').should('be.visible');
		});

		it('auto-selects first option and enables the place-bet button', () => {
			visitBettingEnabled();

			bettingScreen.placeButton().should('not.be.disabled');
		});

		it('renders wallet journal entries', () => {
			visitBettingEnabled();
			cy.wait('@bettingOverview');

			cy.contains('Wallet Journal').should('be.visible');
			cy.contains('Stake reserve for round winner market').should('be.visible');
		});

		it('renders the targeting preference toggle', () => {
			visitBettingEnabled();
			cy.wait('@bettingOverview');

			cy.contains('Targeting Preference').should('be.visible');
			cy.contains('Opt out').should('be.visible');
		});
	});

	describe('market lifecycle events', () => {
		it('updates market status to locked when market.locked event is received', () => {
			visitBettingEnabled();
			cy.contains('Player One').should('be.visible');

			cy.wsEmit(
				`betting.market.locked.v1.${subjectId}`,
				{
					guild_id: guildId,
					club_uuid: subjectId,
					round_id: 'round-bet-1',
					market_id: 1
				},
				{ validate: false }
			);

			cy.contains(/locked/i).should('be.visible');
			bettingScreen.placeButton().should('be.disabled');
		});

		it('clears market when voided event is received', () => {
			visitBettingEnabled();
			cy.contains('Player One').should('be.visible');

			cy.wsEmit(
				`betting.market.voided.v1.${subjectId}`,
				{
					guild_id: guildId,
					club_uuid: subjectId,
					round_id: 'round-bet-1',
					market_id: 1,
					reason: 'No show'
				},
				{ validate: false }
			);

			cy.contains('Player One').should('not.exist');
		});

		it('reloads overview when market.settled event is received', () => {
			const settledOverview = {
				...mockOverview,
				wallet: { ...mockOverview.wallet, available: 200, adjustment_balance: 60 }
			};

			visitBettingEnabled();
			cy.contains('Player One').should('be.visible');

			// Register after the initial load so it takes priority over @bettingOverview
			cy.intercept('GET', '**/api/betting/overview*', {
				statusCode: 200,
				body: settledOverview
			}).as('settledOverview');

			cy.wsEmit(
				`betting.market.settled.v1.${subjectId}`,
				{
					guild_id: guildId,
					club_uuid: subjectId,
					round_id: 'round-bet-1',
					market_id: 1,
					settlement_version: 1,
					result_summary: 'Player One won'
				},
				{ validate: false }
			);

			cy.wait('@settledOverview');
			// overview reloaded — wallet balance updated
			cy.contains('200').should('be.visible');
		});
	});

	describe('frozen state', () => {
		it('shows the frozen access badge', () => {
			visitBettingFrozen();

			cy.contains(/frozen/i, { matchCase: false }).should('be.visible');
		});

		it('shows the wallet section (read-only history available)', () => {
			visitBettingFrozen();
			cy.wait('@bettingOverview');

			cy.contains('Available Wallet').should('be.visible');
		});

		it('shows the frozen body copy', () => {
			visitBettingFrozen();

			cy.contains('read-only freeze').should('be.visible');
		});

		it('does not show an active bet form in frozen state', () => {
			visitBettingFrozen();

			cy.contains('Place Bet').should('not.exist');
		});
	});

	describe('disabled state', () => {
		it('redirects to home when betting is disabled', () => {
			arrangeBaseSnapshot();
			cy.arrangeAuth({
				path: '/betting',
				clubUuid: subjectId,
				guildId,
				role: 'player',
				linkedProviders: ['discord']
				// no entitlements → defaults to disabled
			});
			cy.wsConnect();

			cy.location('pathname').should('eq', '/');
		});
	});

	describe('navigation', () => {
		it('shows betting nav link when entitlements are enabled', () => {
			arrangeBaseSnapshot();
			cy.arrangeAuth({
				path: '/',
				clubUuid: subjectId,
				guildId,
				role: 'player',
				linkedProviders: ['discord'],
				entitlements: enabledEntitlements
			});
			cy.wsConnect();

			navScreen.expectLinkVisible('Betting', '/betting');
		});

		it('shows betting nav link when entitlements are frozen', () => {
			arrangeBaseSnapshot();
			cy.arrangeAuth({
				path: '/',
				clubUuid: subjectId,
				guildId,
				role: 'player',
				linkedProviders: ['discord'],
				entitlements: frozenEntitlements
			});
			cy.wsConnect();

			navScreen.expectLinkVisible('Betting', '/betting');
		});

		it('hides betting nav link when no entitlements (disabled)', () => {
			arrangeBaseSnapshot();
			cy.arrangeAuth({
				path: '/',
				clubUuid: subjectId,
				guildId,
				role: 'player',
				linkedProviders: ['discord']
			});
			cy.wsConnect();

			navScreen.withPrimaryNavigation(() => {
				cy.get('a[href="/betting"]').should('not.exist');
			});
		});
	});
});
