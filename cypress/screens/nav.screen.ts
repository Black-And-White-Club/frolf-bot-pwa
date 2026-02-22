import { selectors } from '../support/selectors';

function hasVisibleElement($body: JQuery<HTMLElement>, selector: string): boolean {
	return $body.find(selector).filter(':visible').length > 0;
}

export const navScreen = {
	navbar() {
		return cy.get(selectors.navbar);
	},
	desktopNavLinks() {
		return this.navbar().find('nav').filter(':visible').first();
	},
	isCompactLayout() {
		return cy
			.get('body', { log: false })
			.then(($body) => hasVisibleElement($body, selectors.hamburgerOpenButton));
	},
	withPrimaryNavigation(assertions: () => void) {
		return this.isCompactLayout().then((isCompact) => {
			if (!isCompact) {
				this.desktopNavLinks().should('be.visible').within(assertions);
				return;
			}

			this.openHamburger();
			this.hamburgerDialog().should('be.visible').within(assertions);
			this.closeHamburger();
			this.hamburgerDialog().should('not.exist');
		});
	},
	expectLinkVisible(label: string, href: string) {
		this.withPrimaryNavigation(() => {
			cy.contains('a', label).should('be.visible').and('have.attr', 'href', href);
		});
	},
	expectAdminLinkVisible() {
		this.expectLinkVisible('Admin', '/admin');
	},
	expectAdminLinkMissing() {
		this.withPrimaryNavigation(() => {
			cy.get('a[href="/admin"]').should('not.exist');
		});
	},
	openHamburger() {
		cy.get(selectors.hamburgerOpenButton).should('be.visible').click();
	},
	hamburgerDialog() {
		return cy.get(selectors.hamburgerDialog);
	},
	closeHamburger() {
		cy.get(selectors.hamburgerCloseButton).should('be.visible').click();
	},
	expectSignOutControlVisible() {
		this.isCompactLayout().then((isCompact) => {
			if (!isCompact) {
				cy.get(selectors.navbarSignOutButton).should('be.visible');
				return;
			}

			this.openHamburger();
			this.hamburgerDialog().find(selectors.hamburgerSignOutButton).should('be.visible');
			this.closeHamburger();
			this.hamburgerDialog().should('not.exist');
		});
	}
} as const;
