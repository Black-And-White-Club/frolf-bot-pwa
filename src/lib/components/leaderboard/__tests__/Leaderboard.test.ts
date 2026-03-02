/* @vitest-environment jsdom */

/* @vitest-environment jsdom */
import { render, cleanup } from '@testing-library/svelte';
import Leaderboard from '../Leaderboard.svelte';
import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
import { test, expect, describe } from 'vitest';

// ---------------------------------------------------------------------------
// Tie-handling: when two players earned equal points (after a tied finish),
// the leaderboard must render both rows and display the same points value.
// ---------------------------------------------------------------------------
describe('tied players', () => {
	test('renders both tied-points entries', () => {
		const entries: LeaderboardEntry[] = [
			{ tagNumber: 3, userId: 'alice', totalPoints: 1400, roundsPlayed: 5, displayName: 'Alice' },
			{ tagNumber: 11, userId: 'bob', totalPoints: 1400, roundsPlayed: 5, displayName: 'Bob' }
		];

		const { getByTestId, getAllByText } = render(Leaderboard, { props: { entries } });

		// Both rows present
		expect(getByTestId('leaderboard-row-alice')).toBeTruthy();
		expect(getByTestId('leaderboard-row-bob')).toBeTruthy();

		// Both display the same points text ("1400 pts")
		const pointsEls = getAllByText('1400 pts');
		expect(pointsEls).toHaveLength(2);

		cleanup();
	});

	test('tied entries render in tag-number order (tag 3 before tag 11)', () => {
		// Entries supplied in tag order — the component must not reorder them.
		const entries: LeaderboardEntry[] = [
			{ tagNumber: 3, userId: 'alice', totalPoints: 1400, roundsPlayed: 5, displayName: 'Alice' },
			{ tagNumber: 11, userId: 'bob', totalPoints: 1400, roundsPlayed: 5, displayName: 'Bob' }
		];

		const { container } = render(Leaderboard, { props: { entries } });

		const rows = container.querySelectorAll('[data-testid^="leaderboard-row-"]');
		expect(rows).toHaveLength(2);
		expect(rows[0].getAttribute('data-user-id')).toBe('alice');
		expect(rows[1].getAttribute('data-user-id')).toBe('bob');

		cleanup();
	});
});

test('shows empty state when no entries', () => {
	const { getByText } = render(Leaderboard, { props: { entries: [] } });
	getByText('No players yet.');
});

test('renders entries and respects compact prop', () => {
	const entries: LeaderboardEntry[] = [
		{ tagNumber: 1, userId: 'u1', totalPoints: 100, roundsPlayed: 1, displayName: 'User 1' },
		{ tagNumber: 2, userId: 'u2', totalPoints: 200, roundsPlayed: 2, displayName: 'User 2' },
		{ tagNumber: 3, userId: 'u3', totalPoints: 300, roundsPlayed: 3, displayName: 'User 3' }
	];

	// By default the component determines limits based on viewport. In unit
	// tests we run in a desktop-like environment so all entries should render
	// unless explicitly collapsed.
	const { getByTestId } = render(Leaderboard, { props: { entries } });

	expect(getByTestId('leaderboard-row-u1')).toBeTruthy();
	expect(getByTestId('leaderboard-row-u2')).toBeTruthy();
	expect(getByTestId('leaderboard-row-u3')).toBeTruthy();

	// compact mode still renders rows — cleanup previous render to avoid duplicate nodes
	cleanup();
	const { getByTestId: getByTestId2 } = render(Leaderboard, { props: { entries, compact: true } });

	expect(getByTestId2('leaderboard-row-u1')).toBeTruthy();
	expect(getByTestId2('leaderboard-row-u2')).toBeTruthy();
	expect(getByTestId2('leaderboard-row-u3')).toBeTruthy();
});
