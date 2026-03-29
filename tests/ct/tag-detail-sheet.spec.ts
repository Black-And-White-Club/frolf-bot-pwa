import { test, expect } from '@playwright/experimental-ct-svelte';
import TagDetailSheet from '$lib/components/leaderboard/TagDetailSheet.svelte';

const rawHistory = {
	guild_id: 'test-guild',
	entries: [
		{
			id: 1,
			tag_number: 7,
			old_member_id: 'member-2',
			new_member_id: 'member-1',
			reason: 'won',
			created_at: '2025-01-01T10:00:00.000Z'
		},
		{
			id: 2,
			tag_number: 8,
			old_member_id: 'member-1',
			new_member_id: 'member-3',
			reason: 'lost',
			created_at: '2025-01-02T10:00:00.000Z'
		},
		{
			id: 3,
			tag_number: 9,
			old_member_id: 'member-4',
			new_member_id: 'member-1',
			reason: 'challenge',
			created_at: '2025-01-03T10:00:00.000Z'
		}
	]
};

test.describe('TagDetailSheet (Component)', () => {
	test('shows loading state when historyLoading is true', async ({ mount, page }) => {
		await mount(TagDetailSheet, {
			props: { memberId: 'member-1' },
			hooksConfig: {
				tagSetup: {
					selectedMember: 'member-1',
					guildId: 'test-guild',
					historyLoading: true
				}
			}
		});

		await expect(page.locator('.empty-state').filter({ hasText: 'Loading' }).first()).toBeVisible();
	});

	test('shows empty state when member has no cached history', async ({ mount, page }) => {
		await mount(TagDetailSheet, {
			props: { memberId: 'member-1' },
			hooksConfig: {
				tagSetup: {
					selectedMember: 'member-1',
					guildId: 'test-guild'
				}
			}
		});

		await expect(
			page.locator('.empty-state').filter({ hasText: 'No tag history' }).first()
		).toBeVisible();
	});

	test('shows history entries from the store cache sorted most-recent-first', async ({
		mount,
		page
	}) => {
		await mount(TagDetailSheet, {
			props: { memberId: 'member-1' },
			hooksConfig: {
				tagSetup: {
					historyCache: [{ guildId: 'test-guild', memberId: 'member-1', history: rawHistory }],
					selectedMember: 'member-1',
					guildId: 'test-guild'
				}
			}
		});

		await expect(page.locator('.history-group').first()).toBeVisible();
	});
});
