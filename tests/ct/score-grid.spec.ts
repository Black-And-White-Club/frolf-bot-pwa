import { test, expect } from '@playwright/experimental-ct-svelte';
import ScoreGrid from '$lib/components/score/ScoreGrid.svelte';

const par9 = [3, 4, 3, 3, 4, 5, 3, 4, 3];
const holeScores9 = [2, 4, 4, 3, 4, 5, 2, 4, 3];
const holeTotal = holeScores9.reduce((a, b) => a + b, 0);

function buildRound(overrides: object = {}) {
	return {
		id: 'r1',
		state: 'finalized' as const,
		holes: 9,
		parValues: par9,
		participants: [],
		...overrides
	};
}

test.describe('ScoreGrid (Component)', () => {
	test('renders hole numbers as column headers', async ({ mount, page }) => {
		await mount(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		for (let h = 1; h <= 9; h++) {
			await expect(
				page
					.locator('th')
					.filter({ hasText: String(h) })
					.first()
			).toBeVisible();
		}
	});

	test('renders hole-by-hole scores in the correct cells', async ({ mount, page }) => {
		await mount(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		const cells = page.locator('.participant-row-grid .score-cell');
		for (const score of holeScores9) {
			await expect(cells.filter({ hasText: String(score) }).first()).toBeVisible();
		}
	});

	test('shows dash for all holes when participant has no scores array', async ({ mount, page }) => {
		await mount(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: 31, scores: undefined }]
				})
			}
		});

		const cells = page.locator('.participant-row-grid .score-cell');
		const count = await cells.count();
		for (let i = 0; i < count; i++) {
			await expect(cells.nth(i)).toHaveText('-');
		}
	});
});
