/// <reference types="cypress" />
import { accountScreen } from '../screens/account.screen';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

describe('Account Page', () => {
	const subjectId = 'guild-123';

	type SetupOptions = {
		role?: 'viewer' | 'player' | 'editor' | 'admin';
		linkedProviders?: string[];
		invitesStatusCode?: number;
		invitesBody?: unknown;
		stubInvites?: boolean;
	};

	function visitAccount(options: SetupOptions = {}) {
		const role = options.role ?? 'admin';
		const canManageInvites = role === 'editor' || role === 'admin';
		const shouldStubInvites = options.stubInvites ?? canManageInvites;

		cy.arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});

		if (shouldStubInvites) {
			cy.intercept('GET', `**/api/clubs/${subjectId}/invites`, {
				statusCode: options.invitesStatusCode ?? 200,
				body: options.invitesBody ?? []
			}).as('loadInvites');
		}

		cy.arrangeAuth({
			path: '/account',
			clubUuid: subjectId,
			guildId: subjectId,
			role,
			linkedProviders: options.linkedProviders ?? ['discord']
		});
		cy.wsConnect();
		accountScreen.root().should('be.visible');

		if (shouldStubInvites) {
			cy.wait('@loadInvites');
		}
	}

	it('renders connected provider states based on linked providers', () => {
		visitAccount({
			role: 'admin',
			linkedProviders: ['discord']
		});

		accountScreen.discordRow().should('contain', 'Connected').and('contain', 'Disconnect');
		accountScreen.googleRow().should('contain', 'Connect Google');
	});

	it('shows unlink conflict error when disconnecting the only linked provider', () => {
		cy.intercept('DELETE', '**/api/auth/discord/unlink', {
			statusCode: 409,
			body: { error: 'Cannot disconnect only provider' }
		}).as('unlinkDiscord');
		visitAccount({
			role: 'admin',
			linkedProviders: ['discord']
		});

		accountScreen.discordRow().contains('button', 'Disconnect').click();
		cy.wait('@unlinkDiscord');
		cy.contains('Cannot disconnect your only linked account.').should('be.visible');
	});

	it('creates a new invite and prepends it to the list', () => {
		cy.intercept('POST', `**/api/clubs/${subjectId}/invites`, {
			statusCode: 200,
			body: {
				code: 'NEWCODE123',
				role: 'editor',
				use_count: 0,
				max_uses: 5,
				expires_at: '2026-12-31T00:00:00Z',
				created_at: '2026-02-20T00:00:00Z'
			}
		}).as('createInvite');
		visitAccount({
			role: 'editor',
			linkedProviders: ['discord', 'google'],
			invitesBody: [
				{
					code: 'OLDCODE999',
					role: 'player',
					use_count: 1,
					max_uses: null,
					expires_at: null,
					created_at: '2026-01-01T00:00:00Z'
				}
			]
		});

		accountScreen.createRoleSelect().select('editor');
		accountScreen.createMaxUsesInput().type('5');
		accountScreen.createExpiresInput().type('7');
		accountScreen.createInviteButton().click();

		cy.wait('@createInvite');
		accountScreen.expectInvitePresent('NEWCODE123');
	});

	it('renders invite creation errors from the API', () => {
		cy.intercept('POST', `**/api/clubs/${subjectId}/invites`, {
			statusCode: 400,
			body: { error: 'Role not allowed for this club' }
		}).as('createInvite');
		visitAccount({
			role: 'admin',
			linkedProviders: ['discord'],
			invitesBody: []
		});

		accountScreen.createInviteButton().click();

		cy.wait('@createInvite');
		cy.contains('Role not allowed for this club').should('be.visible');
	});

	it('revokes an invite and removes it from the list', () => {
		cy.intercept('DELETE', `**/api/clubs/${subjectId}/invites/REVOKE001`, {
			statusCode: 204,
			body: ''
		}).as('revokeInvite');
		visitAccount({
			role: 'admin',
			linkedProviders: ['discord'],
			invitesBody: [
				{
					code: 'REVOKE001',
					role: 'player',
					use_count: 0,
					max_uses: 2,
					expires_at: null,
					created_at: '2026-02-19T00:00:00Z'
				}
			]
		});

		accountScreen.clickRevoke('REVOKE001');
		cy.wait('@revokeInvite');
		accountScreen.expectInviteMissing('REVOKE001');
	});

	it('hides invite management for non-editor roles', () => {
		visitAccount({
			role: 'player',
			linkedProviders: ['discord'],
			stubInvites: false
		});

		cy.contains('h2', 'Invite Links').should('not.exist');
	});
});
