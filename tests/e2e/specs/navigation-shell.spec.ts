import { test, expect } from '../fixtures';
import { NavPage } from '../pages/nav.page';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Navigation Shell', () => {
	const subjectId = 'guild-123';
	const requiredLinks: Array<{ label: string; href: string }> = [
		{ label: 'Home', href: '/' },
		{ label: 'Rounds', href: '/rounds' },
		{ label: 'Leaderboard', href: '/leaderboard' },
		{ label: 'Docs', href: '/docs' },
		{ label: 'Account', href: '/account' }
	];

	async function arrangeHome(
		{
			arrangeSnapshot,
			arrangeAuth,
			wsConnect
		}: {
			arrangeSnapshot: (o?: object) => void;
			arrangeAuth: (o?: object) => Promise<void>;
			wsConnect: () => Promise<void>;
		},
		role: 'viewer' | 'player' | 'editor' | 'admin'
	) {
		arrangeSnapshot({
			subjectId,
			rounds: [
				buildRoundCreated({
					id: 'round-nav-1',
					guild_id: subjectId,
					title: 'Navigation Round',
					state: 'scheduled',
					participants: []
				})
			],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: subjectId,
				leaderboard: [{ user_id: 'user-1', tag_number: 1, total_points: 100, rounds_played: 1 }]
			}),
			tags: buildTagListSnapshot({
				guild_id: subjectId,
				members: [{ member_id: 'user-1', current_tag: 1 }]
			}),
			profiles: {
				'user-1': {
					user_id: 'user-1',
					display_name: 'Player One',
					avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
				}
			}
		});
		await arrangeAuth({
			path: '/',
			clubUuid: subjectId,
			guildId: subjectId,
			role,
			linkedProviders: ['discord']
		});
		await wsConnect();
	}

	test('shows navigation links for admin users', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const nav = new NavPage(page);
		await arrangeHome({ arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');
		await expectDashboardLoaded(page);

		for (const link of requiredLinks) {
			await nav.expectLinkVisible(link.label, link.href);
		}
		await nav.expectAdminLinkVisible();
		await expect(page.locator('[data-testid="skip-link"]')).toHaveAttribute(
			'href',
			'#main-content'
		);
	});

	test('hides admin navigation link for non-admin users', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const nav = new NavPage(page);
		await arrangeHome({ arrangeSnapshot, arrangeAuth, wsConnect }, 'player');
		await expectDashboardLoaded(page);

		await nav.expectLinkVisible('Home', '/');
		await nav.expectLinkVisible('Account', '/account');
		await nav.expectAdminLinkMissing();
	});

	test('shows the expected menu controls for the active layout', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const nav = new NavPage(page);
		await arrangeHome({ arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');
		await expectDashboardLoaded(page);

		await nav.expectSignOutControlVisible();

		const isCompact = await nav.isCompactLayout();
		if (!isCompact) {
			return;
		}

		await nav.openHamburger();
		await expect(nav.hamburgerDialog()).toBeVisible();
		await expect(nav.hamburgerDialog().locator('a[href="/admin"]')).toBeVisible();
		await expect(nav.hamburgerDialog().locator('[data-testid="btn-signout-mobile"]')).toBeVisible();
		await nav.closeHamburger();
		await expect(nav.hamburgerDialog()).toHaveCount(0);
	});

	test('shows betting nav link when entitlements are enabled', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const nav = new NavPage(page);
		arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] }),
			profiles: {}
		});
		await arrangeAuth({
			path: '/',
			clubUuid: subjectId,
			guildId: subjectId,
			role: 'player',
			linkedProviders: ['discord'],
			entitlements: {
				features: {
					betting: { key: 'betting', state: 'enabled', source: 'subscription', reason: '' }
				}
			}
		});
		await wsConnect();

		await nav.expectLinkVisible('Betting', '/betting');
	});

	test('hides betting nav link when entitlements are disabled (omitted)', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const nav = new NavPage(page);
		await arrangeHome({ arrangeSnapshot, arrangeAuth, wsConnect }, 'player');
		await expectDashboardLoaded(page);

		await nav.withPrimaryNavigation(async () => {
			await expect(page.locator('a[href="/betting"]')).toHaveCount(0);
		});
	});
});
