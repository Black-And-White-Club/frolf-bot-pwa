/* @vitest-environment jsdom */
import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import ScoreCard from '../ScoreCard.svelte';

test('renders score and scoreText correctly for par', () => {
	const { getByText } = render(ScoreCard, {
		props: { playerName: 'Alice', score: 3, par: 3, holeNumber: 1 }
	});
	expect(getByText('Alice')).toBeTruthy();
	expect(getByText('Hole 1')).toBeTruthy();
	expect(getByText('3')).toBeTruthy();
	expect(getByText('(E)')).toBeTruthy();
});

test('renders under par with negative text', () => {
	const { getByText } = render(ScoreCard, {
		props: { playerName: 'Bob', score: 2, par: 3, holeNumber: 2 }
	});
	expect(getByText('Bob')).toBeTruthy();
	expect(getByText('(-1)')).toBeTruthy();
});
