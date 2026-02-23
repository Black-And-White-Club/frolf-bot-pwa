import { selectors } from '../support/selectors';

export const createRoundScreen = {
	createRouteButton() {
		return cy.get(selectors.createRoundRouteButton);
	},
	createPage() {
		return cy.get(selectors.createRoundPage);
	},
	form() {
		return cy.get(selectors.createRoundForm);
	},
	fillForm(values: {
		title: string;
		description?: string;
		startTime: string;
		timezone?: string;
		location: string;
	}) {
		cy.get('[data-testid="input-create-round-title"]').clear().type(values.title);
		cy.get('[data-testid="input-create-round-description"]').clear();
		if (values.description) {
			cy.get('[data-testid="input-create-round-description"]').type(values.description);
		}
		cy.get('[data-testid="input-create-round-start-time"]').clear().type(values.startTime);
		cy.get('[data-testid="input-create-round-timezone"]').clear();
		if (values.timezone) {
			cy.get('[data-testid="input-create-round-timezone"]').type(values.timezone);
		}
		cy.get('[data-testid="input-create-round-location"]').clear().type(values.location);
	},
	submit() {
		cy.get('[data-testid="btn-create-round-submit"]').click();
	},
	expectRequestedBannerVisible() {
		cy.get(selectors.createRoundRequestedBanner).should('be.visible');
	}
} as const;
