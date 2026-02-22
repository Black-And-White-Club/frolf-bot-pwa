/// <reference types="cypress" />

import HamburgerMenu from '$lib/components/general/HamburgerMenu.svelte';
import { auth } from '$lib/stores/auth.svelte';
import { resetMockPageState, setMockPageState } from '../../support/mocks/app-state';
import { hamburgerMenuComponentScreen } from '../../screens/hamburger-menu.component.screen';

describe('HamburgerMenu (Component)', () => {
	beforeEach(() => {
		resetMockPageState();
		setMockPageState({
			pathname: '/',
			session: {
				user: {
					name: 'Test User'
				}
			}
		});

		auth.user = {
			id: 'user-1',
			uuid: 'user-1-uuid',
			activeClubUuid: 'club-1',
			guildId: 'guild-1',
			role: 'admin',
			clubs: [
				{
					club_uuid: 'club-1',
					role: 'admin',
					display_name: 'Test User',
					avatar_url: ''
				}
			],
			linkedProviders: ['discord']
		};
		auth.status = 'authenticated';
	});

	afterEach(() => {
		auth.user = null;
		auth.status = 'idle';
		resetMockPageState();
	});

	it('traps keyboard focus inside the menu', () => {
		const closeHamburger = cy.stub().as('closeHamburger');
		cy.mountComponent(HamburgerMenu, {
			props: { closeHamburger }
		});

		hamburgerMenuComponentScreen.dialog().should('be.visible');
		cy.wait(0);
		hamburgerMenuComponentScreen.closeButton().should('be.focused');

		hamburgerMenuComponentScreen.termsLink().focus().should('be.focused');
		cy.document().trigger('keydown', {
			key: 'Tab',
			bubbles: true,
			cancelable: true
		});
		hamburgerMenuComponentScreen.closeButton().should('be.focused');

		hamburgerMenuComponentScreen.closeButton().focus().should('be.focused');
		cy.document().trigger('keydown', {
			key: 'Tab',
			shiftKey: true,
			bubbles: true,
			cancelable: true
		});
		hamburgerMenuComponentScreen.termsLink().should('be.focused');
	});

	it('calls close handler on Escape key', () => {
		const closeHamburger = cy.stub().as('closeHamburger');
		cy.mountComponent(HamburgerMenu, {
			props: { closeHamburger }
		});

		cy.document().trigger('keydown', {
			key: 'Escape',
			bubbles: true,
			cancelable: true
		});

		cy.get('@closeHamburger').should('have.been.calledOnce');
	});

	it('calls close handler when backdrop is clicked', () => {
		const closeHamburger = cy.stub().as('closeHamburger');
		cy.mountComponent(HamburgerMenu, {
			props: { closeHamburger }
		});

		hamburgerMenuComponentScreen.backdrop().click('center');
		cy.get('@closeHamburger').should('have.been.calledOnce');
	});
});
