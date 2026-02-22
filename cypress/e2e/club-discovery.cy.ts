/// <reference types="cypress" />

describe('Club Discovery', () => {
	const subjectId = 'guild-123';

	function visitDiscovery() {
		cy.arrangeAuth({
			path: '/',
			activeClubUuid: '',
			guildId: subjectId,
			role: 'viewer',
			linkedProviders: ['discord'],
			clubs: []
		});
	}

	it('shows suggested clubs when authenticated user has no memberships', () => {
		cy.intercept('GET', '**/api/clubs/suggestions', {
			statusCode: 200,
			body: [
				{
					uuid: 'club-001',
					name: 'Pier Park Club',
					icon_url: ''
				}
			]
		}).as('clubSuggestions');
		visitDiscovery();

		cy.wait('@clubSuggestions');
		cy.contains('h2', 'Join a Club').should('be.visible');
		cy.contains("You're signed in but not yet a member of any club.").should('be.visible');
		cy.contains('Pier Park Club').should('be.visible');
		cy.contains('button', 'Join').should('be.visible');
	});

	it('shows error when joining a suggested club fails', () => {
		cy.intercept('GET', '**/api/clubs/suggestions', {
			statusCode: 200,
			body: [
				{
					uuid: 'club-002',
					name: 'Northwest Tags',
					icon_url: ''
				}
			]
		}).as('clubSuggestions');
		cy.intercept('POST', '**/api/clubs/join', {
			statusCode: 400,
			body: { error: 'Membership closed' }
		}).as('joinClub');
		visitDiscovery();

		cy.wait('@clubSuggestions');
		cy.contains('Northwest Tags')
			.parents('div.flex.items-center.justify-between')
			.contains('button', 'Join')
			.click();
		cy.wait('@joinClub');
		cy.contains('Membership closed').should('be.visible');
	});

	it('shows error for invalid invite code join attempts', () => {
		cy.intercept('GET', '**/api/clubs/suggestions', {
			statusCode: 200,
			body: []
		}).as('clubSuggestions');
		cy.intercept('POST', '**/api/clubs/join-by-code', {
			statusCode: 400,
			body: { error: 'Invalid or expired invite code' }
		}).as('joinByCode');
		visitDiscovery();

		cy.wait('@clubSuggestions');
		cy.get('input[placeholder="Enter invite code"]').type('BADCODE');
		cy.contains('button', /^Join$/).click();
		cy.wait('@joinByCode');
		cy.contains('Invalid or expired invite code').should('be.visible');
	});
});
