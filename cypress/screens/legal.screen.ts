export const legalScreen = {
	expectPrivacyPage() {
		cy.contains('h1', 'Privacy Policy').should('be.visible');
	},
	expectTosPage() {
		cy.contains('h1', 'Terms of Service').should('be.visible');
	},
	expectLegalFooterLinks() {
		cy.contains('footer a', 'Home').should('be.visible');
		cy.contains('footer a', 'Docs').should('be.visible');
	}
} as const;
