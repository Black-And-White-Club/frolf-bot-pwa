/// <reference types="cypress" />

declare global {
	namespace Cypress {
		interface Chainable {
			getMockNats(): Chainable<any>;
			publishNatsEvent(subject: string, payload: unknown): Chainable<void>;
			visitWithToken(path?: string, token?: string): Chainable<void>;
			visitMockMode(path?: string): Chainable<void>;
		}
	}
}

Cypress.Commands.add('visitWithToken', (path = '/', token = 'mock-jwt-token') => {
	cy.visit(`${path}#t=${token}`);
});

Cypress.Commands.add('visitMockMode', (path = '/') => {
	cy.visit(`${path}?mock=true`);
});

export {};
