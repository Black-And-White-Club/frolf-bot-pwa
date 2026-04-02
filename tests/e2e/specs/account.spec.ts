import { test, expect } from '../fixtures';
import { AccountPage } from '../pages/account.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

test.describe('Account Page', () => {
	const subjectId = 'guild-123';

	type SetupOptions = {
		role?: 'viewer' | 'player' | 'editor' | 'admin';
		linkedProviders?: string[];
		invitesStatusCode?: number;
		invitesBody?: unknown;
		stubInvites?: boolean;
	};

	async function visitAccount(
		{
			page,
			arrangeSnapshot,
			arrangeAuth,
			wsConnect
		}: {
			page: import('@playwright/test').Page;
			arrangeSnapshot: (o?: object) => void;
			arrangeAuth: (o?: object) => Promise<void>;
			wsConnect: () => Promise<void>;
		},
		options: SetupOptions = {}
	) {
		const account = new AccountPage(page);
		const role = options.role ?? 'admin';
		const canManageInvites = role === 'editor' || role === 'admin';
		const shouldStubInvites = options.stubInvites ?? canManageInvites;

		arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});

		if (shouldStubInvites) {
			await page.route(`**/api/clubs/${subjectId}/invites`, (route) => {
				if (route.request().method() === 'GET') {
					route.fulfill({
						status: options.invitesStatusCode ?? 200,
						contentType: 'application/json',
						body: JSON.stringify(options.invitesBody ?? [])
					});
				} else {
					route.fallback();
				}
			});
		}

		await arrangeAuth({
			path: '/account',
			clubUuid: subjectId,
			guildId: subjectId,
			role,
			linkedProviders: options.linkedProviders ?? ['discord']
		});
		await wsConnect();
		await expect(account.root()).toBeVisible();

		if (shouldStubInvites) {
			await expect(account.inviteLinksSection()).toBeVisible();
		}
	}

	test('renders connected provider states based on linked providers', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const account = new AccountPage(page);
		await visitAccount(
			{ page, arrangeSnapshot, arrangeAuth, wsConnect },
			{
				role: 'admin',
				linkedProviders: ['discord']
			}
		);

		await expect(account.discordRow()).toContainText('Connected');
		await expect(account.discordRow()).toContainText('Disconnect');
		await expect(account.googleRow()).toContainText('Connect Google');
	});

	test('shows unlink conflict error when disconnecting the only linked provider', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const account = new AccountPage(page);
		await page.route('**/api/auth/discord/unlink', (route) =>
			route.fulfill({
				status: 409,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Cannot disconnect only provider' })
			})
		);
		await visitAccount(
			{ page, arrangeSnapshot, arrangeAuth, wsConnect },
			{
				role: 'admin',
				linkedProviders: ['discord']
			}
		);

		await Promise.all([
			page.waitForResponse('**/api/auth/discord/unlink'),
			account.discordRow().getByRole('button', { name: 'Disconnect' }).click()
		]);
		await expect(page.getByText('Cannot disconnect your only linked account.')).toBeVisible();
	});

	test('creates a new invite and prepends it to the list', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const account = new AccountPage(page);
		await page.route(`**/api/clubs/${subjectId}/invites`, (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						code: 'NEWCODE123',
						role: 'editor',
						use_count: 0,
						max_uses: 5,
						expires_at: '2026-12-31T00:00:00Z',
						created_at: '2026-02-20T00:00:00Z'
					})
				});
			} else {
				route.fallback();
			}
		});
		await visitAccount(
			{ page, arrangeSnapshot, arrangeAuth, wsConnect },
			{
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
			}
		);

		await account.createRoleSelect().selectOption('editor');
		await account.createMaxUsesInput().fill('5');
		await account.createExpiresInput().fill('7');
		await Promise.all([
			page.waitForResponse(
				(response) =>
					response.url().includes(`/api/clubs/${subjectId}/invites`) &&
					response.request().method() === 'POST'
			),
			account.createInviteButton().click()
		]);
		await expect(account.inviteCode('NEWCODE123')).toBeVisible();
	});

	test('renders invite creation errors from the API', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const account = new AccountPage(page);
		await page.route(`**/api/clubs/${subjectId}/invites`, (route) => {
			if (route.request().method() === 'POST') {
				route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Role not allowed for this club' })
				});
			} else {
				route.fallback();
			}
		});
		await visitAccount(
			{ page, arrangeSnapshot, arrangeAuth, wsConnect },
			{
				role: 'admin',
				linkedProviders: ['discord'],
				invitesBody: []
			}
		);

		await Promise.all([
			page.waitForResponse(
				(response) =>
					response.url().includes(`/api/clubs/${subjectId}/invites`) &&
					response.request().method() === 'POST'
			),
			account.createInviteButton().click()
		]);
		await expect(page.getByText('Role not allowed for this club')).toBeVisible();
	});

	test('revokes an invite and removes it from the list', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const account = new AccountPage(page);
		await page.route(`**/api/clubs/${subjectId}/invites/REVOKE001`, (route) =>
			route.fulfill({ status: 204, body: '' })
		);
		await visitAccount(
			{ page, arrangeSnapshot, arrangeAuth, wsConnect },
			{
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
			}
		);

		await Promise.all([
			page.waitForResponse(`**/api/clubs/${subjectId}/invites/REVOKE001`),
			account.revokeBtn('REVOKE001').click()
		]);
		await expect(account.inviteCode('REVOKE001')).toHaveCount(0);
	});

	test('hides invite management for non-editor roles', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		await visitAccount(
			{ page, arrangeSnapshot, arrangeAuth, wsConnect },
			{
				role: 'player',
				linkedProviders: ['discord'],
				stubInvites: false
			}
		);

		await expect(page.getByRole('heading', { name: 'Invite Links', level: 2 })).toHaveCount(0);
	});
});
