export const tagLeaderboardComponentScreen = {
	historyBtn(memberId: string) {
		return cy.get(`[data-testid="leaderboard-row-${memberId}"]`).find('.history-btn');
	},
	expandedPanel() {
		return cy.get('.tag-detail-inline');
	},
	rowExpansion() {
		return cy.get('.row-expansion');
	}
} as const;
