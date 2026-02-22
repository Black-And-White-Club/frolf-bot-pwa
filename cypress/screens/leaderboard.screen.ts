import { leaderboardEntryByUser, selectors } from '../support/selectors';

type ExpectLoadedOptions = {
	minRows?: number;
};

type LeaderboardMode = 'tags' | 'points';

export const leaderboardScreen = {
	rows() {
		return cy.get(selectors.leaderboardRow);
	},
	rowByUser(userId: string) {
		return cy.get(leaderboardEntryByUser(userId));
	},
	expectLoaded(options: ExpectLoadedOptions = {}) {
		const minRows = options.minRows ?? 0;
		cy.get(selectors.leaderboardPanel).should('be.visible');
		if (minRows > 0) {
			this.rows().its('length').should('be.gte', minRows);
		}
	},
	expectRowCount(count: number) {
		this.rows().should('have.length', count);
	},
	expectFirstUser(userId: string) {
		this.rows().first().should('have.attr', 'data-user-id', userId);
	},
	expectRowContains(userId: string, value: string) {
		this.rowByUser(userId).should('contain', value);
	},
	setMode(mode: LeaderboardMode) {
		const label = mode === 'points' ? 'Points' : 'Tags';
		cy.get(selectors.leaderboardPanel).within(() => {
			cy.contains('[role="tab"]', label).click();
			cy.contains('[role="tab"]', label).should('have.attr', 'aria-selected', 'true');
		});
	}
} as const;
