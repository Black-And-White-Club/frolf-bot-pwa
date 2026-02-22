/// <reference types="cypress" />
import { roundScreen } from '../screens/round.screen';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';

describe('Rounds Routes', () => {
	const subjectId = 'guild-123';

	function visitRoundsWithSnapshot(path: string, rounds: ReturnType<typeof buildRoundCreated>[]) {
		cy.arrangeSnapshot({
			subjectId,
			rounds,
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] }),
			profiles: {
				'user-1': {
					user_id: 'user-1',
					display_name: 'Player One',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
				}
			}
		});
		cy.arrangeAuth({
			path,
			clubUuid: subjectId,
			guildId: subjectId,
			role: 'player',
			linkedProviders: ['discord']
		});
		cy.wsConnect();
	}

	it('shows grouped round sections and navigates to round detail', () => {
		visitRoundsWithSnapshot('/rounds', [
			buildRoundCreated({
				id: 'round-started',
				guild_id: subjectId,
				title: 'Morning Live Round',
				state: 'started',
				participants: [{ user_id: 'user-1', response: 'accepted', score: 54, tag_number: 1 }]
			}),
			buildRoundCreated({
				id: 'round-scheduled',
				guild_id: subjectId,
				title: 'Weekend Upcoming Round',
				state: 'scheduled',
				participants: []
			}),
			buildRoundCreated({
				id: 'round-finalized',
				guild_id: subjectId,
				title: 'Completed Tag Match',
				state: 'finalized',
				participants: [{ user_id: 'user-1', response: 'accepted', score: 50, tag_number: 1 }]
			})
		]);

		cy.contains('h1', 'Rounds').should('be.visible');
		cy.contains('Live Rounds').should('be.visible');
		cy.contains('Upcoming Rounds').should('be.visible');
		cy.contains('Recent Rounds').should('be.visible');

		roundScreen.expectCardVisible('round-started');
		roundScreen.expectCardVisible('round-scheduled');
		roundScreen.expectCardVisible('round-finalized');

		roundScreen.cardById('round-started').click();
		cy.location('pathname').should('eq', '/rounds/round-started');
		cy.contains('h1', 'Morning Live Round').should('be.visible');
		cy.contains('a', 'Back to rounds').should('have.attr', 'href', '/rounds');
	});

	it('renders not-found fallback for unknown round id', () => {
		visitRoundsWithSnapshot('/rounds/missing-round', []);

		cy.contains('Round not found').should('be.visible');
		cy.contains('a', 'Back to rounds').should('have.attr', 'href', '/rounds');
	});

	it('shows guest sign-in shell for /rounds when unauthenticated', () => {
		cy.arrangeGuest({ path: '/rounds' });

		cy.get('[data-testid="btn-signin"]').should('be.visible');
		cy.contains('Sign in with Discord or Google to access your disc golf games.').should(
			'be.visible'
		);
	});
});
