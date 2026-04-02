import { test, expect } from '../fixtures';
import { DocsPage } from '../pages/docs.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

test.describe('Docs and Legal Routes', () => {
	const subjectId = 'guild-123';

	async function clickDocNavItem(docs: DocsPage, label: string): Promise<void> {
		const isCompact = await docs.mobileNavToggle().isVisible();
		if (!isCompact) {
			await docs.sidebarNav().getByRole('link', { name: label }).click();
			return;
		}
		const expanded = await docs.mobileNavToggle().getAttribute('aria-expanded');
		if (expanded !== 'true') {
			await docs.mobileNavToggle().click();
		}
		await docs.mobileNav().getByRole('link', { name: label }).click();
	}

	test('renders docs overview and navigates between doc sections', async ({
		page,
		arrangeGuest
	}) => {
		const docs = new DocsPage(page);
		await arrangeGuest({ path: '/docs' });

		await expect(
			page.getByRole('heading', { name: 'Frolf Bot — Documentation', level: 1 })
		).toBeVisible();
		await clickDocNavItem(docs, 'Rounds');
		await expect.poll(() => new URL(page.url()).pathname).toBe('/docs/rounds');
		await expect(page.getByRole('heading', { name: 'Rounds', level: 1 })).toBeVisible();
	});

	test('uses the active docs navigation container for the current layout', async ({
		page,
		arrangeGuest
	}) => {
		const docs = new DocsPage(page);
		await arrangeGuest({ path: '/docs' });

		const isCompact = await docs.mobileNavToggle().isVisible();
		if (!isCompact) {
			await expect(docs.sidebarNav()).toBeVisible();
			await clickDocNavItem(docs, 'Tags & Leaderboard');
			await expect.poll(() => new URL(page.url()).pathname).toBe('/docs/tags');
			await expect(
				page.getByRole('heading', { name: 'Tags & Leaderboard', level: 1 })
			).toBeVisible();
		} else {
			await expect(docs.mobileNavToggle()).toBeVisible();
			const expanded = await docs.mobileNavToggle().getAttribute('aria-expanded');
			if (expanded !== 'true') {
				await docs.mobileNavToggle().click();
			}
			await expect(docs.mobileNav()).toBeVisible();
			await docs.mobileNav().getByRole('link', { name: 'Tags & Leaderboard' }).click();
			await expect.poll(() => new URL(page.url()).pathname).toBe('/docs/tags');
			await expect(
				page.getByRole('heading', { name: 'Tags & Leaderboard', level: 1 })
			).toBeVisible();
		}
	});

	test('renders privacy policy and links to terms', async ({ page, arrangeGuest }) => {
		await arrangeGuest({ path: '/privacy' });

		await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible();
		await expect(page.locator('footer').getByRole('link', { name: 'Home' })).toBeVisible();
		await expect(page.locator('footer').getByRole('link', { name: 'Docs' })).toBeVisible();

		await page.getByRole('link', { name: 'Terms of Service' }).first().click();
		await expect.poll(() => new URL(page.url()).pathname).toBe('/tos');
		await expect(page.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeVisible();
	});

	test('renders terms of service and links back to privacy', async ({ page, arrangeGuest }) => {
		await arrangeGuest({ path: '/tos' });

		await expect(page.getByRole('heading', { name: 'Terms of Service', level: 1 })).toBeVisible();
		await expect(page.locator('footer').getByRole('link', { name: 'Home' })).toBeVisible();
		await expect(page.locator('footer').getByRole('link', { name: 'Docs' })).toBeVisible();

		await page.getByRole('link', { name: 'Privacy Policy' }).first().click();
		await expect.poll(() => new URL(page.url()).pathname).toBe('/privacy');
		await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible();
	});

	test('renders auth error route for authenticated sessions', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});
		await arrangeAuth({
			path: '/auth/error',
			clubUuid: subjectId,
			guildId: subjectId,
			role: 'player'
		});
		await wsConnect();

		await expect(page.getByRole('heading', { name: 'Auth Error', level: 1 })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/');
	});
});
