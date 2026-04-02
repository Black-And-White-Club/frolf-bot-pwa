import { test } from '../fixtures';
import { expect } from '@playwright/test';
import { RoundPage } from '../pages/round.page';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';

test.describe('Round Flow', () => {
	const subjectId = 'guild-123';

	async function seedRounds(
		page: import('@playwright/test').Page,
		rounds: Array<ReturnType<typeof buildRoundCreated>>
	): Promise<void> {
		await page.evaluate(async (roundList) => {
			const { roundService } = await import('/src/lib/stores/round.svelte.ts');
			roundService.setRoundsFromApi(roundList);
			roundService.setLoading(false);
		}, rounds);
	}

	async function applyRoundUpdate(
		page: import('@playwright/test').Page,
		update:
			| { type: 'started'; roundId: string }
			| {
					type: 'participants';
					roundId: string;
					participants: Array<{
						userId: string;
						response: 'accepted' | 'declined' | 'tentative';
						score: number | null;
						tagNumber: number | null;
					}>;
			  }
			| { type: 'score'; roundId: string; userId: string; score: number }
			| { type: 'deleted'; roundId: string }
	): Promise<void> {
		await page.evaluate(async (event) => {
			const { roundService } = await import('/src/lib/stores/round.svelte.ts');
			switch (event.type) {
				case 'started':
					roundService.handleRoundUpdated({
						roundId: event.roundId,
						update: { state: 'started' }
					});
					break;
				case 'participants':
					roundService.handleRoundUpdated({
						roundId: event.roundId,
						update: { participants: event.participants }
					});
					break;
				case 'score':
					roundService.handleScoreUpdated({
						roundId: event.roundId,
						userId: event.userId,
						score: event.score
					});
					break;
				case 'deleted':
					roundService.handleRoundDeleted({ roundId: event.roundId });
					break;
			}
		}, update);
	}

	test.beforeEach(async ({ arrangeSnapshot, arrangeAuth, wsConnect, page }) => {
		arrangeSnapshot({
			subjectId,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
		});
		await arrangeAuth({ path: '/rounds', clubUuid: subjectId, guildId: subjectId });
		await wsConnect();
		await expect(page.getByRole('heading', { name: 'Rounds' })).toBeVisible();
	});

	test('displays a new round when round.created is received', async ({ page }) => {
		const round = new RoundPage(page);
		await seedRounds(page, [
			buildRoundCreated({
				id: 'round-1',
				guild_id: subjectId,
				title: 'Weekly Tag Round',
				location: 'Pier Park'
			})
		]);

		await expect(round.cardById('round-1')).toBeVisible();
		await expect(round.cardById('round-1')).toContainText('Weekly Tag Round');
		await expect(round.cardById('round-1')).toContainText('Pier Park');
	});

	test('updates card state when round.started is received', async ({ page }) => {
		const round = new RoundPage(page);
		await seedRounds(page, [buildRoundCreated({ id: 'round-1', guild_id: subjectId })]);
		await applyRoundUpdate(page, { type: 'started', roundId: 'round-1' });

		await expect(round.cardById('round-1')).toHaveAttribute('data-state', 'started');
	});

	test('updates participant count when round.participant.joined is received', async ({ page }) => {
		const round = new RoundPage(page);
		await seedRounds(page, [buildRoundCreated({ id: 'round-1', guild_id: subjectId })]);
		await applyRoundUpdate(page, {
			type: 'participants',
			roundId: 'round-1',
			participants: [{ userId: 'user-2', response: 'accepted', score: null, tagNumber: 5 }]
		});

		await expect(round.cardById('round-1')).toContainText(/1\s*player/i);
	});

	test('shows score preview after round.participant.score.updated on finalized rounds', async ({
		page
	}) => {
		const round = new RoundPage(page);
		await seedRounds(page, [
			buildRoundCreated({
				id: 'round-1',
				guild_id: subjectId,
				state: 'finalized',
				participants: [{ user_id: 'user-2', response: 'accepted', score: null, tag_number: 5 }]
			})
		]);
		await applyRoundUpdate(page, {
			type: 'score',
			roundId: 'round-1',
			userId: 'user-2',
			score: -3
		});

		await expect(round.cardById('round-1')).toContainText('-3');
	});

	test('removes the round card when round.deleted is received', async ({ page }) => {
		const round = new RoundPage(page);
		await seedRounds(page, [buildRoundCreated({ id: 'round-1', guild_id: subjectId })]);
		await expect(round.cardById('round-1')).toBeVisible();

		await applyRoundUpdate(page, { type: 'deleted', roundId: 'round-1' });
		await expect(round.cardById('round-1')).toHaveCount(0);
	});
});
