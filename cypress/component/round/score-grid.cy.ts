/// <reference types="cypress" />

import ScoreGrid from '$lib/components/score/ScoreGrid.svelte';

// 9-hole par values for a standard disc golf course
const par9 = [3, 4, 3, 3, 4, 5, 3, 4, 3];
const parTotal = par9.reduce((a, b) => a + b, 0); // 32

// A player who scored birdie, par, bogey per hole relative to par
// par: [3,4,3,3,4,5,3,4,3]
// scores:[2,4,4,3,4,5,2,4,3] → diff: [-1,0,+1,0,0,0,-1,0,0]
const holeScores9 = [2, 4, 4, 3, 4, 5, 2, 4, 3];
const holeTotal = holeScores9.reduce((a, b) => a + b, 0); // 31

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
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		for (let h = 1; h <= 9; h++) {
			cy.contains('th', String(h)).should('be.visible');
		}
	});

	it('renders hole-by-hole scores in the correct cells', () => {
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		// Every score value should appear in a score cell
		cy.get('.score-cell').then(($cells) => {
			const texts = [...$cells].map((el) => el.textContent?.trim());
			holeScores9.forEach((s) => {
				expect(texts).to.include(String(s));
			});
		});
	});

	it('shows - for all holes when participant has no scores array', () => {
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Bob', score: 36 }]
				})
			}
		});

		// 9 score cells (excluding par row) should all show -
		cy.get('.participant-row-grid .score-cell').each(($cell) => {
			expect($cell.text().trim()).to.equal('-');
		});
	});

	it('shows values for present holes and - for absent holes (partial import)', () => {
		const partialScores = [3, 4, 3]; // only holes 1–3 scored

		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Carol', score: 10, scores: partialScores }]
				})
			}
		});

		cy.get('.participant-row-grid .score-cell').then(($cells) => {
			// First 3 cells should have values
			expect($cells.eq(0).text().trim()).to.equal('3');
			expect($cells.eq(1).text().trim()).to.equal('4');
			expect($cells.eq(2).text().trim()).to.equal('3');
			// Remaining 6 cells should be dashes
			for (let i = 3; i < 9; i++) {
				expect($cells.eq(i).text().trim()).to.equal('-');
			}
		});
	});

	it('applies score-birdie class for scores below par', () => {
		// Hole 1: score 2, par 3 → birdie
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		// Hole 1 cell (index 0) should have birdie class (2 < 3)
		cy.get('.participant-row-grid .score-cell').eq(0).should('have.class', 'score-birdie');
	});

	it('applies score-bogey class for scores above par', () => {
		// Hole 3: score 4, par 3 → bogey
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		// Hole 3 cell (index 2) should have bogey class (4 > 3)
		cy.get('.participant-row-grid .score-cell').eq(2).should('have.class', 'score-bogey');
	});

	it('applies score-par class for scores equal to par', () => {
		// Hole 2: score 4, par 4 → par
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		// Hole 2 cell (index 1) should have par class (4 = 4)
		cy.get('.participant-row-grid .score-cell').eq(1).should('have.class', 'score-par');
	});

	it('renders the par row with correct per-hole par values', () => {
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		cy.get('.par-row .score-cell').then(($cells) => {
			par9.forEach((p, i) => {
				expect($cells.eq(i).text().trim()).to.equal(String(p));
			});
		});
	});

	it('renders the par row total', () => {
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 }]
				})
			}
		});

		cy.get('.par-row .total-cell').should('contain.text', String(parTotal));
	});

	it('shows hole score sum as total when scores array is present', () => {
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Alice', score: 99, scores: holeScores9 }]
				})
			}
		});

		// total derived from sum of holeScores9 (31), not the score field (99)
		cy.get('.participant-row-grid .total-cell').should('contain.text', String(holeTotal));
	});

	it('falls back to participant.score for total when scores array absent', () => {
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [{ userId: '', rawName: 'Bob', score: 36 }]
				})
			}
		});

		cy.get('.participant-row-grid .total-cell').should('contain.text', '36');
	});

	it('only shows participants with non-null scores', () => {
		cy.mountComponent(ScoreGrid, {
			props: {
				round: buildRound({
					participants: [
						{ userId: '', rawName: 'Alice', score: holeTotal, scores: holeScores9 },
						{ userId: '', rawName: 'Bob', score: null } // not scored yet
					]
				})
			}
		});

		// Only Alice should appear (Bob has null score)
		cy.get('.participant-row-grid').should('have.length', 1);
		cy.contains('.player-name', 'Alice').should('be.visible');
	});

	it('defaults to 18 holes when round.holes is not set', () => {
		cy.mountComponent(ScoreGrid, {
			props: {
				round: {
					id: 'r1',
					state: 'finalized',
					parValues: undefined,
					participants: [{ userId: '', rawName: 'Alice', score: 54 }]
				}
			}
		});

		// 18 hole header columns
		cy.get('thead th.hole-column').should('have.length', 18);
	});
});
