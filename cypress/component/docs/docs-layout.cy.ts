/// <reference types="cypress" />

import DocsLayout from '../../../src/routes/docs/+layout.svelte';
import { resetMockPageState, setMockPageState } from '../../support/mocks/app-state';
import { docsLayoutComponentScreen } from '../../screens/docs-layout.component.screen';

describe('Docs Layout (Component)', () => {
	beforeEach(() => {
		resetMockPageState();
	});

	afterEach(() => {
		resetMockPageState();
	});

	it('toggles mobile navigation and collapses after link click', () => {
		cy.viewport(393, 852);
		setMockPageState({ pathname: '/docs' });
		cy.mountComponent(DocsLayout);

		docsLayoutComponentScreen.mobileToggle().should('be.visible');
		docsLayoutComponentScreen.mobileToggle().should('have.attr', 'aria-expanded', 'false');

		docsLayoutComponentScreen.mobileToggle().click();
		docsLayoutComponentScreen.mobileToggle().should('have.attr', 'aria-expanded', 'true');
		docsLayoutComponentScreen.mobileNav().should('be.visible');

		docsLayoutComponentScreen.attachPreventDefaultToMobileLink('Tags & Leaderboard');
		docsLayoutComponentScreen.clickMobileLink('Tags & Leaderboard');

		docsLayoutComponentScreen.mobileToggle().should('have.attr', 'aria-expanded', 'false');
		docsLayoutComponentScreen.mobileNav().should('not.exist');
	});

	it('renders desktop sidebar and marks the active link', () => {
		cy.viewport(1280, 720);
		setMockPageState({ pathname: '/docs/scoring' });
		cy.mountComponent(DocsLayout);

		docsLayoutComponentScreen.sidebarNav().should('be.visible');
		docsLayoutComponentScreen.mobileToggle().should('not.be.visible');
		docsLayoutComponentScreen
			.sidebarNav()
			.contains('a', 'Scoring')
			.should('have.class', 'font-semibold');
	});
});
