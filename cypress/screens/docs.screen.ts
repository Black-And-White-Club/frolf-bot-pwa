function hasVisibleElement($body: JQuery<HTMLElement>, selector: string): boolean {
	return $body.find(selector).filter(':visible').length > 0;
}

export const docsScreen = {
	root() {
		return cy.contains('h1', 'Frolf Bot — Documentation').closest('article');
	},
	sidebarNav() {
		return cy.get('nav[aria-label="Documentation navigation"]').first();
	},
	mobileNavToggle() {
		return cy.get('button[aria-controls="docs-mobile-nav"]');
	},
	mobileNav() {
		return cy.get('#docs-mobile-nav');
	},
	isCompactLayout() {
		return cy
			.get('body', { log: false })
			.then(($body) => hasVisibleElement($body, 'button[aria-controls="docs-mobile-nav"]'));
	},
	clickNavItem(label: string) {
		this.isCompactLayout().then((isCompact) => {
			if (!isCompact) {
				this.sidebarNav().contains('a', label).should('be.visible').click();
				return;
			}

			this.openMobileNav();
			this.mobileNav().should('be.visible').contains('a', label).click();
		});
	},
	openMobileNav() {
		this.mobileNavToggle()
			.should('be.visible')
			.then(($toggle) => {
				if ($toggle.attr('aria-expanded') === 'true') {
					return;
				}
				cy.wrap($toggle).click();
			});
	},
	expectHeading(text: string) {
		cy.contains('h1', text).should('be.visible');
	}
} as const;
