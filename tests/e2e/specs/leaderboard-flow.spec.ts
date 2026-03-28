import { test } from '../fixtures';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

test.describe('Leaderboard Flow', () => {
	const subjectId = 'guild-123';

	async function seedLeaderboardState(
		page: import('@playwright/test').Page,
		{
			leaderboard,
			tags,
			profiles = {}
		}: {
			leaderboard: ReturnType<typeof buildLeaderboardSnapshot>;
			tags: ReturnType<typeof buildTagListSnapshot>;
			profiles?: Record<string, unknown>;
		}
	) {
		await page.evaluate(
			async ({ snapshot, tagList, profileMap }) => {
				const [{ leaderboardService }, { tagStore }, { userProfiles }] = await Promise.all([
					import('/src/lib/stores/leaderboard.svelte.ts'),
					import('/src/lib/stores/tags.svelte.ts'),
					import('/src/lib/stores/userProfiles.svelte.ts')
				]);
				userProfiles.setProfilesFromApi(profileMap);
				leaderboardService.setSnapshotFromApi(snapshot);
				tagStore.applyTagListResponse(tagList);
			},
			{ snapshot: leaderboard, tagList: tags, profileMap: profiles }
		);
	}

	async function applyLeaderboardEvent(
		page: import('@playwright/test').Page,
		event:
			| {
					type: 'tag-updated';
					userId: string;
					oldTag?: number;
					newTag?: number;
			  }
			| { type: 'tag-swapped'; userIdA: string; userIdB: string }
	): Promise<void> {
		await page.evaluate(async (nextEvent) => {
			const [{ leaderboardService }, { tagStore }] = await Promise.all([
				import('/src/lib/stores/leaderboard.svelte.ts'),
				import('/src/lib/stores/tags.svelte.ts')
			]);
			switch (nextEvent.type) {
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
				case 'tag-swapped':
					leaderboardService.applyPatch({
						op: 'swap_tags',
						userIdA: nextEvent.userIdA,
						userIdB: nextEvent.userIdB
					});
					tagStore.swapTagMembers(nextEvent.userIdA, nextEvent.userIdB);
					break;
			}
		}, event);
	}

	test.beforeEach(async ({ arrangeSnapshot, arrangeAuth, wsConnect, page }) => {
		const initialLeaderboard = buildLeaderboardSnapshot({
			guild_id: subjectId,
			leaderboard: [
				{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
				{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 },
				{ user_id: 'user-3', tag_number: 3, total_points: 425, rounds_played: 6 }
			]
		});
		const tags = buildTagListSnapshot({
			guild_id: subjectId,
			members: [
				{ member_id: 'user-1', current_tag: 1 },
				{ member_id: 'user-2', current_tag: 2 },
				{ member_id: 'user-3', current_tag: 3 }
			]
		});
		arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: initialLeaderboard,
			tags
		});
		await arrangeAuth({ path: '/leaderboard', clubUuid: subjectId, guildId: subjectId });
		await wsConnect();
		await seedLeaderboardState(page, { leaderboard: initialLeaderboard, tags });
		const leaderboardPage = new LeaderboardPage(page);
		await leaderboardPage.expectLoaded({ minRows: 3 });
	});

	test('displays leaderboard rows from snapshot', async ({ page }) => {
		const leaderboard = new LeaderboardPage(page);
		await leaderboard.expectLoaded({ minRows: 3 });
		await leaderboard.expectRowCount(3);
		await leaderboard.expectFirstUser('user-1');
	});

	test('reorders rows after leaderboard.tag.updated', async ({ page, arrangeSnapshot }) => {
		const leaderboard = new LeaderboardPage(page);
		const snapshot = buildLeaderboardSnapshot({
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
		arrangeSnapshot({
			subjectId,
			leaderboard: snapshot,
			tags
		});
		await seedLeaderboardState(page, { leaderboard: snapshot, tags });

		await leaderboard.expectFirstUser('user-1');

		await applyLeaderboardEvent(page, {
			type: 'tag-updated',
			userId: 'user-2',
			oldTag: 5,
			newTag: 1
		});
		await leaderboard.expectFirstUser('user-2');
	});

	test('swaps tags after leaderboard.tag.swap.processed', async ({ page, arrangeSnapshot }) => {
		const leaderboard = new LeaderboardPage(page);
		const snapshot = buildLeaderboardSnapshot({
			guild_id: subjectId,
			leaderboard: [
				{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
				{ user_id: 'user-2', tag_number: 5, total_points: 450, rounds_played: 7 }
			]
		});
		const tags = buildTagListSnapshot({
			guild_id: subjectId,
			members: [
				{ member_id: 'user-1', current_tag: 1 },
				{ member_id: 'user-2', current_tag: 5 }
			]
		});
		arrangeSnapshot({
			subjectId,
			leaderboard: snapshot,
			tags
		});
		await seedLeaderboardState(page, { leaderboard: snapshot, tags });

		await applyLeaderboardEvent(page, {
			type: 'tag-swapped',
			userIdA: 'user-1',
			userIdB: 'user-2'
		});

		await leaderboard.expectFirstUser('user-2');
	});

	test('reloads snapshot after leaderboard.updated event', async ({ page, wsStubRequest }) => {
		const leaderboard = new LeaderboardPage(page);
		await leaderboard.expectRowCount(3);

		const updatedSnapshot = buildLeaderboardSnapshot({
			guild_id: subjectId,
			leaderboard: [
				{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
				{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 },
				{ user_id: 'user-3', tag_number: 3, total_points: 425, rounds_played: 6 },
				{ user_id: 'user-4', tag_number: 4, total_points: 390, rounds_played: 6 }
			]
		});
		const updatedTags = buildTagListSnapshot({
			guild_id: subjectId,
			members: [
				{ member_id: 'user-1', current_tag: 1 },
				{ member_id: 'user-2', current_tag: 2 },
				{ member_id: 'user-3', current_tag: 3 },
				{ member_id: 'user-4', current_tag: 4 }
			]
		});
		wsStubRequest(`leaderboard.snapshot.request.v2.${subjectId}`, updatedSnapshot);
		wsStubRequest(`leaderboard.tag.list.requested.v1.${subjectId}`, updatedTags);

		await seedLeaderboardState(page, { leaderboard: updatedSnapshot, tags: updatedTags });
		await leaderboard.expectRowCount(4);
	});
});
