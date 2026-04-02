import { test, expect } from '../fixtures';
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

	function applyLeaderboardEvent(
		wsEmit: (subject: string, payload: unknown) => void,
		event:
			| {
					type: 'tag-updated';
					userId: string;
					oldTag?: number;
					newTag?: number;
			  }
			| { type: 'tag-swapped'; userIdA: string; userIdB: string }
	): void {
		switch (event.type) {
			case 'tag-updated':
				wsEmit(`leaderboard.tag.updated.v2.${subjectId}`, {
					user_id: event.userId,
					old_tag: event.oldTag,
					new_tag: event.newTag
				});
				break;
			case 'tag-swapped':
				wsEmit(`leaderboard.tag.swap.processed.v2.${subjectId}`, {
					requestor_id: event.userIdA,
					target_id: event.userIdB
				});
				break;
		}
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
		await wsConnect({
			requiredSubjects: [
				`leaderboard.tag.updated.v2.${subjectId}`,
				`leaderboard.tag.swap.processed.v2.${subjectId}`
			]
		});
		await seedLeaderboardState(page, { leaderboard: initialLeaderboard, tags });
		const leaderboard = new LeaderboardPage(page);
		await expect
			.poll(async () => await leaderboard.rows().count(), { timeout: 15000 })
			.toBeGreaterThanOrEqual(3);
	});

	test('displays leaderboard rows from snapshot', async ({ page }) => {
		const leaderboard = new LeaderboardPage(page);
		await expect
			.poll(async () => await leaderboard.rows().count(), { timeout: 15000 })
			.toBeGreaterThanOrEqual(3);
		await expect(leaderboard.rows()).toHaveCount(3);
		await expect(leaderboard.rows().first()).toHaveAttribute('data-user-id', 'user-1');
	});

	test('reorders rows after leaderboard.tag.updated', async ({ page, arrangeSnapshot, wsEmit }) => {
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

		await expect(leaderboard.rows().first()).toHaveAttribute('data-user-id', 'user-1');

		applyLeaderboardEvent(wsEmit, {
			type: 'tag-updated',
			userId: 'user-2',
			oldTag: 5,
			newTag: 1
		});
		await expect(leaderboard.rows().first()).toHaveAttribute('data-user-id', 'user-2');
	});

	test('swaps tags after leaderboard.tag.swap.processed', async ({
		page,
		arrangeSnapshot,
		wsEmit
	}) => {
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

		applyLeaderboardEvent(wsEmit, {
			type: 'tag-swapped',
			userIdA: 'user-1',
			userIdB: 'user-2'
		});

		await expect(leaderboard.rows().first()).toHaveAttribute('data-user-id', 'user-2');
	});

	test('reloads snapshot after leaderboard.updated event', async ({ page, wsStubRequest }) => {
		const leaderboard = new LeaderboardPage(page);
		await expect(leaderboard.rows()).toHaveCount(3);

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
		await expect(leaderboard.rows()).toHaveCount(4);
	});
});
