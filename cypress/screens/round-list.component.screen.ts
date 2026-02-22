export const roundListComponentScreen = {
	roundCardById(roundId: string) {
		return cy.get(`[data-testid="round-card"][data-round-id="${roundId}"]`);
	},
	sectionBySlug(slug: string) {
		return cy.get(`[data-testid="rounds-section-${slug}"]`);
	},
	chevronBySlug(slug: string) {
		return cy.get(`[data-testid="chevron-${slug}"]`);
	}
} as const;
