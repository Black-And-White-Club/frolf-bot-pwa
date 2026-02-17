describe('Round Flow', () => {
	beforeEach(() => {
		cy.mockNats();
		cy.visit('/#t=mock-jwt-token');
		cy.wait(500); // Wait for connection
	});

	it('displays round when created event received', () => {
		cy.sendNatsMessage('round.created.v1.guild-123', {
			id: 'round-1',
			guild_id: 'guild-123',
			title: 'Weekly Tag Round',
			location: 'Pier Park',
			description: 'Casual weekly round',
			start_time: '2026-01-25T10:00:00Z',
			state: 'scheduled',
			created_by: 'user-1',
			event_message_id: 'msg-1',
			participants: []
		});

		cy.get('[data-testid="round-card"]')
			.should('exist')
			.and('contain', 'Weekly Tag Round')
			.and('contain', 'Pier Park');
	});

	it('updates round when started event received', () => {
		// First create the round
		cy.sendNatsMessage('round.created.v1.guild-123', {
			id: 'round-1',
			guild_id: 'guild-123',
			title: 'Weekly Tag',
			location: 'Pier Park',
			description: '',
			start_time: '2026-01-25T10:00:00Z',
			state: 'scheduled',
			created_by: 'user-1',
			event_message_id: 'msg-1',
			participants: []
		});

		cy.get('[data-testid="round-card"]').should('exist');

		// Then start it
		cy.sendNatsMessage('round.started.v1.guild-123', {
			round_id: 'round-1'
		});

		cy.get('[data-testid="round-card"]').should('have.attr', 'data-state', 'started');
	});

	it('adds participant when joined event received', () => {
		// Create round
		cy.sendNatsMessage('round.created.v1.guild-123', {
			id: 'round-1',
			guild_id: 'guild-123',
			title: 'Weekly Tag',
			location: 'Pier Park',
			description: '',
			start_time: '2026-01-25T10:00:00Z',
			state: 'scheduled',
			created_by: 'user-1',
			event_message_id: 'msg-1',
			participants: []
		});

		// Participant joins
		cy.sendNatsMessage('round.participant.joined.v1.guild-123', {
			round_id: 'round-1',
			participant: {
				user_id: 'user-2',
				response: 'accepted',
				score: null,
				tag_number: 5
			}
		});

		cy.get('[data-testid="participant-count"]').should('contain', '1');
	});

	it('updates score when score event received', () => {
		// Create round with participant
		cy.sendNatsMessage('round.created.v1.guild-123', {
			id: 'round-1',
			guild_id: 'guild-123',
			title: 'Weekly Tag',
			location: 'Pier Park',
			description: '',
			start_time: '2026-01-25T10:00:00Z',
			state: 'started',
			created_by: 'user-1',
			event_message_id: 'msg-1',
			participants: [
				{
					user_id: 'user-2',
					response: 'accepted',
					score: null,
					tag_number: 5
				}
			]
		});

		// Score update
		cy.sendNatsMessage('round.participant.score.updated.v1.guild-123', {
			round_id: 'round-1',
			user_id: 'user-2',
			score: -3
		});

		cy.get('[data-testid="participant-score"]').should('contain', '-3');
	});

	it('removes round when deleted event received', () => {
		// Create round
		cy.sendNatsMessage('round.created.v1.guild-123', {
			id: 'round-1',
			guild_id: 'guild-123',
			title: 'Weekly Tag',
			location: 'Pier Park',
			description: '',
			start_time: '2026-01-25T10:00:00Z',
			state: 'scheduled',
			created_by: 'user-1',
			event_message_id: 'msg-1',
			participants: []
		});

		cy.get('[data-testid="round-card"]').should('exist');

		// Delete round
		cy.sendNatsMessage('round.deleted.v1.guild-123', {
			round_id: 'round-1'
		});

		cy.get('[data-testid="round-card"]').should('not.exist');
	});
});
