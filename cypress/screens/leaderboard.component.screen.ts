export const leaderboardComponentScreen = {
	root() {
		return cy.get('[data-testid="ct-leaderboard"]');
	},
	rows() {
		return this.root().find('[data-testid^="leaderboard-row-"]');
	},
	viewAllButton() {
		return this.root().contains('button', 'View all');
	},
	chevron() {
		return this.root().find('[data-testid="ct-leaderboard-chevron"]');
	}
} as const;
