import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { RoundPage } from '../pages/round.page';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';
import { expectDashboardLoaded, expectLeaderboardLoaded } from '../support/helpers';

test.describe('Dashboard', () => {
	const subjectId = 'guild-123';

	async function applyRoundCreated(
		page: import('@playwright/test').Page,
		round: ReturnType<typeof buildRoundCreated>
	): Promise<void> {
		await page.evaluate(async (roundRaw) => {
			const { roundService } = await import('/src/lib/stores/round.svelte.ts');
			roundService.handleRoundCreated(roundRaw);
			roundService.setLoading(false);
		}, round);
	}

	async function applyLeaderboardSnapshot(
		page: import('@playwright/test').Page,
		snapshot: ReturnType<typeof buildLeaderboardSnapshot>
	): Promise<void> {
		await page.evaluate(async (nextSnapshot) => {
			const { leaderboardService } = await import('/src/lib/stores/leaderboard.svelte.ts');
			leaderboardService.setSnapshotFromApi(nextSnapshot);
		}, snapshot);
	}

	test.describe('Mock Mode', () => {
		test('displays dashboard shells without live NATS', async ({ page, visitMockMode }) => {
			const dashboard = new DashboardPage(page);
			await visitMockMode();

			await expectDashboardLoaded(page);
			await expect(dashboard.root()).toBeVisible();
		});

		test('shows loading state and then round cards', async ({ page, visitMockMode }) => {
			const dashboard = new DashboardPage(page);
			await visitMockMode();

			await expect(dashboard.root()).toBeVisible();
		});
	});

	test.describe('Live NATS Events', () => {
		test.beforeEach(async ({ arrangeSnapshot, arrangeAuth, wsConnect, page }) => {
			arrangeSnapshot({
				subjectId,
				rounds: [],
				leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
				tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
			});
			await arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
			await wsConnect();
			await expectDashboardLoaded(page);
			const leaderboard = new LeaderboardPage(page);
			await leaderboard.setMode('points');
		});

		test('renders newly created round from event stream', async ({ page }) => {
			const round = new RoundPage(page);
			await applyRoundCreated(
				page,
				buildRoundCreated({
					id: 'round-live-2',
					guild_id: subjectId,
					title: 'Live Round from WS',
					location: 'Pier Park'
				})
			);

			await round.expectCardContains('round-live-2', 'Live Round from WS');
		});

		test('reloads leaderboard snapshot after leaderboard.updated event', async ({
			page,
			arrangeSnapshot
		}) => {
			const updatedSnapshot = buildLeaderboardSnapshot({
				leaderboard: [
					{ tag_number: 1, user_id: 'user-live-1', total_points: 1111, rounds_played: 14 }
				]
			});
			arrangeSnapshot({
				subjectId,
				leaderboard: updatedSnapshot
			});
			await applyLeaderboardSnapshot(page, updatedSnapshot);

			await expectLeaderboardLoaded(page, { minRows: 1 });
		});
	});
});
