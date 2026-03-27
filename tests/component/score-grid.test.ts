// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ScoreGrid from '../../src/lib/components/score/ScoreGrid.svelte';

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

describe('ScoreGrid (Component)', () => {
it('renders hole numbers as column headers', () => {
const { container } = render(ScoreGrid, {
props: {
round: buildRound({
participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
})
}
});

for (let h = 1; h <= 9; h++) {
const found = Array.from(container.querySelectorAll('th')).some(
(el) => el.textContent?.trim() === String(h)
);
expect(found, `header for hole ${h}`).toBe(true);
}
});

it('renders hole-by-hole scores in the correct cells', () => {
const { container } = render(ScoreGrid, {
props: {
round: buildRound({
participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
})
}
});

const cells = Array.from(container.querySelectorAll('.score-cell'));
const texts = cells.map((el) => el.textContent?.trim());
holeScores9.forEach((s) => {
expect(texts).toContain(String(s));
});
});

it('shows dash for all holes when participant has no scores array', () => {
const { container } = render(ScoreGrid, {
props: {
round: buildRound({
participants: [{ userId: '', rawName: 'Alice', score: 31, scores: undefined }]
})
}
});

const cells = Array.from(container.querySelectorAll('.score-cell'));
cells.forEach((cell) => {
expect(cell.textContent?.trim()).toBe('-');
});
});
});
