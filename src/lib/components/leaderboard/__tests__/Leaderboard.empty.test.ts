/* @vitest-environment jsdom */
import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import Leaderboard from '../Leaderboard.svelte';

test('shows empty state when no entries', () => {
	const { getByText } = render(Leaderboard, { props: { entries: [] } });
	expect(getByText('No players yet.')).toBeTruthy();
});
