import { selectors } from '../support/selectors';

export const dashboardScreen = {
	root() {
		return cy.get(selectors.dashboard, { timeout: 15000 });
	},
	roundsPanel() {
		return cy.get(selectors.roundsPanel);
	},
	leaderboardPanel() {
		return cy.get(selectors.leaderboardPanel);
	},
	loadingSkeleton() {
		return cy.get(selectors.loadingSkeleton);
	},
	roundCards() {
		return cy.get(selectors.roundCard);
	},
	expectLoaded() {
		this.root().should('be.visible');
		this.roundsPanel().should('be.visible');
		this.leaderboardPanel().should('be.visible');
	},
	expectRoundCountAtLeast(minCount: number) {
		this.roundCards().its('length').should('be.gte', minCount);
	},
	expectContainsText(text: string) {
		this.root().contains(text).should('be.visible');
	}
} as const;
