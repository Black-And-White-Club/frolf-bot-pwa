describe('Dashboard', () => {
	describe('Mock Mode', () => {
		it('displays mock data without NATS connection', () => {
			cy.visitMockMode();

			cy.get('[data-testid="dashboard"]').should('exist');
			cy.get('[data-testid="rounds-panel"]').should('exist');
			cy.get('[data-testid="leaderboard-panel"]').should('exist');

			// Mock data should be visible
			cy.contains('Weekly Tag').should('exist');
			cy.contains('Jake "Ace" Thompson').should('exist');
		});

		it('shows loading states then data', () => {
			cy.visitMockMode();

			// Loading skeletons appear briefly
			cy.get('[data-testid="loading-skeleton"]').should('exist');

			// Then data appears
			cy.get('[data-testid="round-card"]').should('have.length.at.least', 1);
		});
	});

	describe('TV Mode', () => {
		it('displays in portrait layout', () => {
			cy.viewport(1080, 1920); // Portrait TV
			cy.visitMockMode('/?mode=tv');

			cy.get('.tv-mode').should('exist');
			cy.get('.dashboard-grid').should('have.css', 'grid-template-columns', '1fr');
		});
	});

	describe('Live NATS Events', () => {
		it('displays round when event received', () => {
			cy.visitWithToken();

			// Wait for connection
			cy.get('[data-testid="connection-status"]').should('contain', 'Connected');

			// Publish a round event
			cy.publishNatsEvent('round.created.v1', {
				id: 'round-123',
				title: 'Test Round',
				state: 'scheduled',
				startTime: new Date().toISOString(),
				participants: []
			});

			// Verify it appears
			cy.get('[data-testid="round-card"]').should('contain', 'Test Round');
		});

		it('updates leaderboard when event received', () => {
			cy.visitWithToken();

			cy.publishNatsEvent('leaderboard.updated.v1', {
				entries: [{ userId: '1', displayName: 'Test Player', tag: 1, points: 1000, movement: 0 }]
			});

			cy.get('[data-testid="leaderboard-row"]').should('contain', 'Test Player');
		});
	});
});
