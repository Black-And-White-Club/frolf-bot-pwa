export const hamburgerMenuComponentScreen = {
	dialog() {
		return cy.get('[role="dialog"][aria-modal="true"]');
	},
	backdrop() {
		return cy.get('[role="presentation"][aria-hidden="true"]');
	},
	closeButton() {
		return this.dialog().find('button[aria-label="Close menu"]');
	},
	termsLink() {
		return this.dialog().contains('a', 'Terms of Service');
	},
	privacyLink() {
		return this.dialog().contains('a', 'Privacy Policy');
	}
} as const;
