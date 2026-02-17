describe('Leaderboard Flow', () => {
	beforeEach(() => {
		cy.mockNats();
		cy.visit('/#t=mock-jwt-token');
		cy.wait(500);
	});

	it('displays leaderboard when snapshot received', () => {
		cy.sendNatsMessage('leaderboard.updated.v1.guild-123', {
			leaderboard_data: {
				id: 'lb-1',
				guild_id: 'guild-123',
				version: 1,
				last_updated: '2026-01-23T12:00:00Z',
				entries: [
					{ user_id: 'user-1', tag_number: 1, display_name: 'Player One' },
					{ user_id: 'user-2', tag_number: 2, display_name: 'Player Two' },
					{ user_id: 'user-3', tag_number: 3, display_name: 'Player Three' }
				]
			}
		});

		cy.get('[data-testid="leaderboard-entry"]').should('have.length', 3);

		cy.get('[data-testid="leaderboard-entry"]')
			.first()
			.should('contain', 'Player One')
			.and('contain', '#1');
	});

	it('updates entry when tag updated event received', () => {
		// Initial leaderboard
		cy.sendNatsMessage('leaderboard.updated.v1.guild-123', {
			leaderboard_data: {
				id: 'lb-1',
				guild_id: 'guild-123',
				version: 1,
				last_updated: '2026-01-23T12:00:00Z',
				entries: [
					{ user_id: 'user-1', tag_number: 1 },
					{ user_id: 'user-2', tag_number: 2 }
				]
			}
		});

		// Tag update
		cy.sendNatsMessage('leaderboard.tag.updated.v1.guild-123', {
			user_id: 'user-2',
			old_tag: 2,
			new_tag: 1
		});

		// User-2 should now be first
		cy.get('[data-testid="leaderboard-entry"]')
			.first()
			.should('have.attr', 'data-user-id', 'user-2');
	});

	it('swaps tags when swap event received', () => {
		// Initial leaderboard
		cy.sendNatsMessage('leaderboard.updated.v1.guild-123', {
			leaderboard_data: {
				id: 'lb-1',
				guild_id: 'guild-123',
				version: 1,
				last_updated: '2026-01-23T12:00:00Z',
				entries: [
					{ user_id: 'user-1', tag_number: 1 },
					{ user_id: 'user-2', tag_number: 5 }
				]
			}
		});

		// Tag swap
		cy.sendNatsMessage('leaderboard.tag.swap.processed.v1.guild-123', {
			requestor_id: 'user-1',
			target_id: 'user-2'
		});

		// Verify swap happened
		cy.get('[data-testid="leaderboard-entry"][data-user-id="user-1"]').should('contain', '#5');

		cy.get('[data-testid="leaderboard-entry"][data-user-id="user-2"]').should('contain', '#1');
	});

	it('shows movement indicator after tag change', () => {
		// Initial leaderboard
		cy.sendNatsMessage('leaderboard.updated.v1.guild-123', {
			leaderboard_data: {
				id: 'lb-1',
				guild_id: 'guild-123',
				version: 1,
				last_updated: '2026-01-23T12:00:00Z',
				entries: [{ user_id: 'user-1', tag_number: 5 }]
			}
		});

		// Tag improves
		cy.sendNatsMessage('leaderboard.tag.updated.v1.guild-123', {
			user_id: 'user-1',
			old_tag: 5,
			new_tag: 2
		});

		cy.get('[data-testid="movement-indicator"]').should('have.class', 'movement-up');
	});
});
