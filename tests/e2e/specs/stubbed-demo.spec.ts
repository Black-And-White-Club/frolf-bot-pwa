import { test, expect } from '../fixtures';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { RoundPage } from '../pages/round.page';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Dashboard Snapshot + Live Events', () => {
	const subjectId = 'guild-123';

	async function seedDashboardState(
		page: import('@playwright/test').Page,
		{
			rounds,
			leaderboard,
			tags,
			profiles
		}: {
			rounds: ReturnType<typeof buildRoundCreated>[];
			leaderboard: ReturnType<typeof buildLeaderboardSnapshot>;
			tags: ReturnType<typeof buildTagListSnapshot>;
			profiles: Record<string, unknown>;
		}
	): Promise<void> {
		await page.evaluate(
			async ({ roundList, leaderboardSnapshot, tagList, profileMap }) => {
				const [{ roundService }, { leaderboardService }, { tagStore }, { userProfiles }] =
					await Promise.all([
						import('/src/lib/stores/round.svelte.ts'),
						import('/src/lib/stores/leaderboard.svelte.ts'),
						import('/src/lib/stores/tags.svelte.ts'),
						import('/src/lib/stores/userProfiles.svelte.ts')
					]);
				userProfiles.setProfilesFromApi(profileMap);
				roundService.setRoundsFromApi(roundList);
				roundService.setLoading(false);
				leaderboardService.setSnapshotFromApi(leaderboardSnapshot);
				tagStore.applyTagListResponse(tagList);
			},
			{ roundList: rounds, leaderboardSnapshot: leaderboard, tagList: tags, profileMap: profiles }
		);
	}

	async function applyDashboardEvent(
		page: import('@playwright/test').Page,
		event:
			| { type: 'round-created'; round: ReturnType<typeof buildRoundCreated> }
			| { type: 'tag-updated'; userId: string; oldTag?: number; newTag?: number }
	): Promise<void> {
		await page.evaluate(async (nextEvent) => {
			const [{ roundService }, { leaderboardService }, { tagStore }] = await Promise.all([
				import('/src/lib/stores/round.svelte.ts'),
				import('/src/lib/stores/leaderboard.svelte.ts'),
				import('/src/lib/stores/tags.svelte.ts')
			]);
			switch (nextEvent.type) {
				case 'round-created':
					roundService.handleRoundCreated(nextEvent.round);
					roundService.setLoading(false);
					break;
				case 'tag-updated':
					leaderboardService.applyPatch({
						op: 'upsert_entry',
						entry: {
							userId: nextEvent.userId,
							tagNumber: nextEvent.newTag,
							previousTagNumber: nextEvent.oldTag
						}
					});
					tagStore.upsertTagMember({
						memberId: nextEvent.userId,
						currentTag: nextEvent.newTag ?? null
					});
					break;
			}
		}, event);
	}

	test.beforeEach(async ({ arrangeSnapshot, arrangeAuth, wsConnect, page }) => {
		const rounds = [
			buildRoundCreated({
				id: 'round-stub-1',
				guild_id: subjectId,
				title: 'Stubbed Round',
				state: 'started',
				participants: [
					{
						user_id: 'user-1',
						response: 'accepted',
						score: null,
						tag_number: 1
					}
				]
			})
		];
		const leaderboard = buildLeaderboardSnapshot({
			guild_id: subjectId,
			leaderboard: [
				{ user_id: 'user-1', tag_number: 2, total_points: 500, rounds_played: 8 },
				{ user_id: 'user-2', tag_number: 5, total_points: 450, rounds_played: 7 }
			]
		});
		const tags = buildTagListSnapshot({
			guild_id: subjectId,
			members: [
				{ member_id: 'user-1', current_tag: 2 },
				{ member_id: 'user-2', current_tag: 5 }
			]
		});
		const profiles = {
			'user-1': {
				user_id: 'user-1',
				display_name: 'Stubbed Player One',
				avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
			},
			'user-2': {
				user_id: 'user-2',
				display_name: 'Stubbed Player Two',
				avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
			}
		};
		arrangeSnapshot({
			subjectId,
			rounds,
			leaderboard,
			tags,
			profiles
		});

		await arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
		await wsConnect();
		await expectDashboardLoaded(page);
		await seedDashboardState(page, { rounds, leaderboard, tags, profiles });
	});

	test('renders snapshot data without waiting for full end-to-end flow', async ({ page }) => {
		const round = new RoundPage(page);
		const leaderboard = new LeaderboardPage(page);

		await expect(round.cards()).toHaveCount(1);
		await round.expectCardContains('round-stub-1', 'Stubbed Round');
		await leaderboard.expectRowCount(2);
		await expect(page.getByText('Stubbed Player One')).toBeVisible();
	});

	test('applies live websocket events after initial snapshot', async ({ page }) => {
		const round = new RoundPage(page);
		const leaderboard = new LeaderboardPage(page);

		await expect(round.cards()).toHaveCount(1);

		await applyDashboardEvent(page, {
			type: 'round-created',
			round: buildRoundCreated({
				id: 'round-live-2',
				guild_id: subjectId,
				title: 'Live Round from WS',
				location: 'Pier Park'
			})
		});
		await applyDashboardEvent(page, {
			type: 'tag-updated',
			userId: 'user-2',
			oldTag: 5,
			newTag: 1
		});

		await expect(round.cards()).toHaveCount(2);
		await round.expectCardContains('round-live-2', 'Live Round from WS');
		await leaderboard.expectFirstUser('user-2');
	});
});
