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

	function applyDashboardEvent(
		wsEmit: (subject: string, payload: unknown) => void,
		event:
			| { type: 'round-created'; round: ReturnType<typeof buildRoundCreated> }
			| { type: 'tag-updated'; userId: string; oldTag?: number; newTag?: number }
	): void {
		switch (event.type) {
			case 'round-created':
				wsEmit(`round.created.v2.${subjectId}`, event.round);
				break;
			case 'tag-updated':
				wsEmit(`leaderboard.tag.updated.v2.${subjectId}`, {
					user_id: event.userId,
					old_tag: event.oldTag,
					new_tag: event.newTag
				});
				break;
		}
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
		await wsConnect({
			requiredSubjects: [`round.created.v2.${subjectId}`, `leaderboard.tag.updated.v2.${subjectId}`]
		});
		await expectDashboardLoaded(page);
		await seedDashboardState(page, { rounds, leaderboard, tags, profiles });
	});

	test('renders snapshot data without waiting for full end-to-end flow', async ({ page }) => {
		const round = new RoundPage(page);
		const leaderboard = new LeaderboardPage(page);

		await expect(round.cards()).toHaveCount(1);
		await expect(round.cardById('round-stub-1')).toContainText('Stubbed Round');
		await expect(leaderboard.rows()).toHaveCount(2);
		await expect(page.getByText('Stubbed Player One')).toBeVisible();
	});

	test('applies live websocket events after initial snapshot', async ({ page, wsEmit }) => {
		const round = new RoundPage(page);
		const leaderboard = new LeaderboardPage(page);

		await expect(round.cards()).toHaveCount(1);

		applyDashboardEvent(wsEmit, {
			type: 'round-created',
			round: buildRoundCreated({
				id: 'round-live-2',
				guild_id: subjectId,
				title: 'Live Round from WS',
				location: 'Pier Park'
			})
		});
		applyDashboardEvent(wsEmit, {
			type: 'tag-updated',
			userId: 'user-2',
			oldTag: 5,
			newTag: 1
		});

		await expect(round.cards()).toHaveCount(2);
		await expect(round.cardById('round-live-2')).toContainText('Live Round from WS');
		await expect(leaderboard.rows().first()).toHaveAttribute('data-user-id', 'user-2');
	});
});
