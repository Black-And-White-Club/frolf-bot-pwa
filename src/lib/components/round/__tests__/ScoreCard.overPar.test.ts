/* @vitest-environment jsdom */
import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import ScoreCard from '$lib/components/score/ScoreCard.svelte';

test('renders over par with positive text', () => {
	const { getByText } = render(ScoreCard, {
		props: { playerName: 'Charlie', score: 5, par: 3, holeNumber: 4 }
	});
	expect(getByText('Charlie')).toBeTruthy();
	// score 5 on par 3 should show +2
	expect(getByText('( +2 )'.replace(/ /g, '')) || getByText('(+2)')).toBeTruthy();
});
