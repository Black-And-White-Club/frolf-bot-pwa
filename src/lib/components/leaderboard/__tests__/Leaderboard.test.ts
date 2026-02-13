/* @vitest-environment jsdom */

/* @vitest-environment jsdom */
import { render, cleanup } from '@testing-library/svelte';
import Leaderboard from '../Leaderboard.svelte';
import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
import { test, expect } from 'vitest';

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
