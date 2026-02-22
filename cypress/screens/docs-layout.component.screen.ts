export const docsLayoutComponentScreen = {
	mobileToggle() {
		return cy.get('button[aria-controls="docs-mobile-nav"]');
	},
	mobileNav() {
		return cy.get('#docs-mobile-nav');
	},
	sidebarNav() {
		return cy.get('aside nav[aria-label="Documentation navigation"]');
	},
	attachPreventDefaultToMobileLink(label: string) {
		this.mobileNav()
			.contains('a', label)
			.then(($link) => {
				$link.on('click', (event) => event.preventDefault());
			});
	},
	clickMobileLink(label: string) {
		this.mobileNav().contains('a', label).click();
	}
} as const;
