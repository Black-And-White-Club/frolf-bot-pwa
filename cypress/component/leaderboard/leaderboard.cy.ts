/// <reference types="cypress" />

import Leaderboard from '$lib/components/leaderboard/Leaderboard.svelte';
import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
import { isMobile } from '$lib/stores/theme';
import { leaderboardComponentScreen } from '../../screens/leaderboard.component.screen';

const entries: LeaderboardEntry[] = Array.from({ length: 7 }, (_, index) => ({
	userId: `user-${index + 1}`,
	tagNumber: index + 1,
	totalPoints: 300 - index * 10,
	roundsPlayed: 5 + index,
	displayName: `Player ${index + 1}`
}));

describe('Leaderboard (Component)', () => {
	afterEach(() => {
		isMobile.set(false);
	});

	it('runs view-all callback and collapses rows', () => {
		const onViewAll = cy.stub().as('onViewAll');
		cy.mountComponent(Leaderboard, {
			props: {
				entries,
				limit: 2,
				onViewAll,
				testid: 'ct-leaderboard'
			}
		});

		leaderboardComponentScreen.rows().should('have.length', 2);
		leaderboardComponentScreen.viewAllButton().should('be.visible').click();
		cy.get('@onViewAll').should('have.been.calledOnce');

		leaderboardComponentScreen.chevron().should('have.attr', 'aria-expanded', 'true');
		leaderboardComponentScreen.chevron().click();
		leaderboardComponentScreen.chevron().should('have.attr', 'aria-expanded', 'false');
		leaderboardComponentScreen.rows().should('not.exist');
	});

	it('uses mobile default limits when mobile mode is active', () => {
		isMobile.set(true);
		cy.mountComponent(Leaderboard, {
			props: {
				entries,
				onViewAll: () => {},
				testid: 'ct-leaderboard'
			}
		});

		leaderboardComponentScreen.rows().should('have.length', 5);
		leaderboardComponentScreen.viewAllButton().should('be.visible');
	});

	it('shows full list without view-all when desktop mode has fewer than 10 entries', () => {
		isMobile.set(false);
		cy.mountComponent(Leaderboard, {
			props: {
				entries,
				onViewAll: () => {},
				testid: 'ct-leaderboard'
			}
		});

		leaderboardComponentScreen.rows().should('have.length', 7);
		leaderboardComponentScreen.viewAllButton().should('not.exist');
	});
});
