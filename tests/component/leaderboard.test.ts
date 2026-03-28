// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect, afterEach, vi } from 'vitest';
import Leaderboard from '../../src/lib/components/leaderboard/Leaderboard.svelte';
import type { LeaderboardEntry } from '../../src/lib/stores/leaderboard.svelte';
import { isMobile } from '../../src/lib/stores/theme';
import { fireEvent } from '@testing-library/svelte';

const entries: LeaderboardEntry[] = Array.from({ length: 7 }, (_, index) => ({
	userId: `user-${index + 1}`,
	tagNumber: index + 1,
	totalPoints: 300 - index * 10,
	roundsPlayed: 5 + index,
	displayName: `Player ${index + 1}`
}));

describe('Leaderboard (Component)', () => {
	afterEach(() => {
		isMobile.set(false);
	});

	it('runs view-all callback and collapses rows', async () => {
		const onViewAll = vi.fn();
		const { container } = render(Leaderboard, {
			props: {
				entries,
				limit: 2,
				onViewAll,
				testid: 'ct-leaderboard'
			}
		});

		const rows = container.querySelectorAll('[data-testid^="leaderboard-row-"]');
		expect(rows.length).toBe(2);

		const viewAllBtn = container.querySelector('[data-testid="leaderboard-view-all"]');
		if (viewAllBtn) {
			await fireEvent.click(viewAllBtn);
			expect(onViewAll).toHaveBeenCalledOnce();
		}
	});

	it('uses mobile default limits when mobile mode is active', () => {
		isMobile.set(true);
		const { container } = render(Leaderboard, {
			props: {
				entries,
				onViewAll: () => {},
				testid: 'ct-leaderboard'
			}
		});

		const rows = container.querySelectorAll('[data-testid^="leaderboard-row-"]');
		expect(rows.length).toBe(5);
	});

	it('shows full list without view-all when desktop mode has fewer than 10 entries', () => {
		isMobile.set(false);
		const { container } = render(Leaderboard, {
			props: {
				entries,
				onViewAll: () => {},
				testid: 'ct-leaderboard'
			}
		});

		const rows = container.querySelectorAll('[data-testid^="leaderboard-row-"]');
		expect(rows.length).toBe(7);

		const viewAllBtn = container.querySelector('[data-testid="leaderboard-view-all"]');
		expect(viewAllBtn).toBeNull();
	});
});
