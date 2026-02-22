import { mount } from 'cypress/svelte';

Cypress.Commands.add('mountComponent', mount);

declare global {
	namespace Cypress {
		interface Chainable {
			mountComponent: typeof mount;
		}
	}
}

export {};
