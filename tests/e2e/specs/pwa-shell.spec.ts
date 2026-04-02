import { test, expect } from '../fixtures';
import { PwaPage } from '../pages/pwa.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('PWA Shell UX', () => {
	const subjectId = 'guild-123';

	async function visitDashboard({
		arrangeSnapshot,
		arrangeAuth,
		wsConnect,
		page
	}: {
		arrangeSnapshot: (o?: object) => void;
		arrangeAuth: (o?: object) => Promise<void>;
		wsConnect: () => Promise<void>;
		page: import('@playwright/test').Page;
	}) {
		arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});
		await arrangeAuth({ path: '/', clubUuid: subjectId, guildId: subjectId, role: 'player' });
		await wsConnect();
		await expectDashboardLoaded(page);
	}

	test('shows and hides offline indicator on network events', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const pwa = new PwaPage(page);
		await visitDashboard({ arrangeSnapshot, arrangeAuth, wsConnect, page });

		await page.evaluate(() => window.dispatchEvent(new Event('offline')));
		await expect(pwa.offlineBanner()).toBeVisible();
		await expect(pwa.offlineBanner()).toContainText("You're offline");

		await page.evaluate(() => window.dispatchEvent(new Event('online')));
		await expect(pwa.offlineBanner()).toHaveCount(0);
	});

	test('dismisses install prompt for current session', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const pwa = new PwaPage(page);
		await visitDashboard({ arrangeSnapshot, arrangeAuth, wsConnect, page });

		await page.evaluate(() => {
			window.sessionStorage.removeItem('pwa-prompt-dismissed');
		});
		await page.waitForTimeout(250);

		await page.evaluate(() => {
			const evt = new Event('beforeinstallprompt') as Event & {
				prompt?: () => Promise<void>;
				userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
			};
			evt.prompt = () => Promise.resolve();
			evt.userChoice = Promise.resolve({ outcome: 'dismissed' });
			window.dispatchEvent(evt);
		});
		await expect(pwa.installPrompt()).toBeVisible();

		await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
		await expect(pwa.installPrompt()).toBeVisible();

		await pwa.installPromptDismissBtn().click();
		await expect(pwa.installPrompt()).toHaveCount(0);
		const dismissed = await page.evaluate(() =>
			window.sessionStorage.getItem('pwa-prompt-dismissed')
		);
		expect(dismissed).toBe('true');
	});

	test('handles accepted install prompt flow', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const pwa = new PwaPage(page);
		await visitDashboard({ arrangeSnapshot, arrangeAuth, wsConnect, page });

		await page.evaluate(() => {
			window.sessionStorage.removeItem('pwa-prompt-dismissed');
		});
		await page.waitForTimeout(250);

		await page.evaluate(() => {
			const evt = new Event('beforeinstallprompt') as Event & {
				prompt?: () => Promise<void>;
				userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
			};
			evt.prompt = () => Promise.resolve();
			evt.userChoice = Promise.resolve({ outcome: 'accepted' });
			window.dispatchEvent(evt);
		});
		await expect(pwa.installPrompt()).toBeVisible();

		await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
		await expect(pwa.installPrompt()).toBeVisible();

		await pwa.installPromptInstallBtn().click();
		await expect(pwa.installPrompt()).toHaveCount(0);
	});
});
