/* @vitest-environment jsdom */
import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import ScoreCard from '$lib/components/score/ScoreCard.svelte';

test('even par renders E and no pattern element', () => {
	const { getByText, container } = render(ScoreCard, {
		props: { playerName: 'Even', score: 3, par: 3, holeNumber: 1 }
	});
	expect(getByText('Even')).toBeTruthy();
	expect(getByText('(E)')).toBeTruthy();
	// pattern div for under-par should not be present (Tailwind arbitrary bg value)
	const pattern = container.querySelector("div[class*='repeating-linear-gradient']");
	expect(pattern).toBeNull();
});

test('under par shows pattern and negative score text', () => {
	const { getByText, container } = render(ScoreCard, {
		props: { playerName: 'Under', score: 2, par: 3, holeNumber: 2 }
	});
	expect(getByText('Under')).toBeTruthy();
	expect(getByText('(-1)')).toBeTruthy();
	// the decorative success pattern element is rendered when score < par
	const pattern = container.querySelector("div[class*='repeating-linear-gradient']");
	expect(pattern).toBeTruthy();
});

test('over par shows +N in parentheses', () => {
	const { getByText } = render(ScoreCard, {
		props: { playerName: 'Over', score: 5, par: 3, holeNumber: 4 }
	});
	expect(getByText('Over')).toBeTruthy();
	expect(getByText('(+2)') || getByText('( +2 )'.replace(/ /g, ''))).toBeTruthy();
});
