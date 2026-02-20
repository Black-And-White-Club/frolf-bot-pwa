describe('Dashboard with Stubbed NATS', () => {
	beforeEach(() => {
		// Stub the leaderboard request that the dashboard makes on load
		cy.stubNatsRequest('leaderboard.get.v1', {
			entries: [
				{ userId: 'player1', displayName: 'Stubbed Player One', tag: 1, points: 500, movement: 0 },
				{ userId: 'player2', displayName: 'Stubbed Player Two', tag: 2, points: 450, movement: 0 }
			]
		});

		// Stub the active rounds request
		cy.stubNatsRequest('round.list.current.v1', [
			{
				id: 'round-stub-123',
				title: 'Stubbed Round',
				state: 'in_progress',
				startTime: new Date().toISOString(),
				participants: [
					{ userId: 'player1', displayName: 'Stubbed Player One' }
				]
			}
		]);

		cy.visitWithToken();
	});

	it('displays the stubbed leaderboard and active round immediately', () => {
		// Wait for data to load and assert on the DOM
		cy.get('[data-testid="leaderboard-row"]').should('have.length', 2);
		cy.contains('Stubbed Player One').should('exist');
		
		cy.get('[data-testid="round-card"]').should('have.length', 1);
		cy.contains('Stubbed Round').should('exist');
	});

	it('updates the leaderboard when receiving a live server event', () => {
		cy.get('[data-testid="leaderboard-row"]').should('have.length', 2);

		// Simulate the Discord bot updating the leaderboard
		cy.publishNatsEvent('leaderboard.updated.v1', {
			entries: [
				{ userId: 'player1', displayName: 'Stubbed Player One', tag: 2, points: 500, movement: -1 },
				{ userId: 'player2', displayName: 'Stubbed Player Two', tag: 1, points: 550, movement: 1 },
				{ userId: 'player3', displayName: 'New Live Player', tag: 3, points: 300, movement: 0 }
			]
		});

		// Assert the DOM updated in real-time
		cy.get('[data-testid="leaderboard-row"]').should('have.length', 3);
		cy.contains('New Live Player').should('exist');
	});
});
