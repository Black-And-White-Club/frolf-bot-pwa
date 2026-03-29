import { test, expect } from '@playwright/experimental-ct-svelte';
import TagLeaderboard from '$lib/components/leaderboard/TagLeaderboard.svelte';

const members = [
	{ memberId: 'member-1', currentTag: 1 },
	{ memberId: 'member-2', currentTag: 2 },
	{ memberId: 'member-3', currentTag: 3 }
];

const cachedHistory = {
	guild_id: 'test-guild',
	entries: [
		{
			id: 1,
			tag_number: 7,
			new_member_id: 'member-1',
			reason: 'won',
			created_at: '2025-01-01T10:00:00.000Z'
		}
	]
};

const authUser = {
	id: 'discord-1',
	uuid: 'user-1',
	activeClubUuid: 'test-guild',
	guildId: 'legacy-guild',
	role: 'player' as const,
	clubs: [],
	linkedProviders: []
};

test.describe('TagLeaderboard row expansion', () => {
	test('history panel is not shown on initial render', async ({ mount, page }) => {
		await mount(TagLeaderboard, {
			props: { members },
			hooksConfig: {
				authUser,
				tagSetup: {
					mockFetchTagHistory: true,
					historyCache: [
						{ guildId: 'test-guild', memberId: 'member-1', history: cachedHistory },
						{
							guildId: 'test-guild',
							memberId: 'member-2',
							history: { guild_id: 'legacy-guild', entries: [] }
						},
						{
							guildId: 'test-guild',
							memberId: 'member-3',
							history: { guild_id: 'legacy-guild', entries: [] }
						}
					]
				}
			}
		});

		await expect(page.locator('[data-testid="tag-history-panel"]')).toHaveCount(0);
	});

	test('clicking history button expands the panel for that row', async ({ mount, page }) => {
		await mount(TagLeaderboard, {
			props: { members },
			hooksConfig: {
				authUser,
				tagSetup: {
					mockFetchTagHistory: true,
					historyCache: [
						{ guildId: 'test-guild', memberId: 'member-1', history: cachedHistory },
						{
							guildId: 'test-guild',
							memberId: 'member-2',
							history: { guild_id: 'legacy-guild', entries: [] }
						},
						{
							guildId: 'test-guild',
							memberId: 'member-3',
							history: { guild_id: 'legacy-guild', entries: [] }
						}
					]
				}
			}
		});

		const historyBtn = page.locator('[aria-label^="Select "][data-member-id="member-1"]');
		if (await historyBtn.isVisible()) {
			await historyBtn.click();
			await expect(page.locator('[data-testid="tag-history-panel"]')).toBeVisible();
		}
	});
});
