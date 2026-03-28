import { test, expect } from '../fixtures';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Tags Route', () => {
	const subjectId = 'guild-123';

	async function seedTagLeaderboard(
		page: import('@playwright/test').Page,
		{
			leaderboard,
			tags,
			profiles
		}: {
			leaderboard: ReturnType<typeof buildLeaderboardSnapshot>;
			tags: ReturnType<typeof buildTagListSnapshot>;
			profiles: Record<string, unknown>;
		}
	): Promise<void> {
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

	test('renders tag leaderboard and tag history sheet interactions', async ({
		page,
		arrangeSnapshot,
		wsStubRequest,
		arrangeAuth,
		wsConnect
	}) => {
		const leaderboard = buildLeaderboardSnapshot({
			guild_id: subjectId,
			leaderboard: [
				{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
				{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 }
			]
		});
		const tags = buildTagListSnapshot({
			guild_id: subjectId,
			members: [
				{ member_id: 'user-1', current_tag: 1 },
				{ member_id: 'user-2', current_tag: 2 }
			]
		});
		const profiles = {
			'user-1': {
				user_id: 'user-1',
				display_name: 'Player One',
				avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
			},
			'user-2': {
				user_id: 'user-2',
				display_name: 'Player Two',
				avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
			}
		};
		arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard,
			tags,
			profiles
		});
		await arrangeAuth({ path: '/tags', clubUuid: subjectId, guildId: subjectId, role: 'player' });
		wsStubRequest(`leaderboard.tag.history.requested.v1.${subjectId}`, {
			guild_id: subjectId,
			entries: []
		});
		await wsConnect();
		await seedTagLeaderboard(page, { leaderboard, tags, profiles });

		await expectDashboardLoaded(page);
		await expect(page.getByText('Tag Leaderboard')).toBeVisible();
		await page.locator('[aria-label^="Select "]').first().click();
		await expect(page.locator('.tag-detail-inline')).toBeVisible();
		await expect(page.getByText('No tag history available.')).toBeVisible();
	});
});
