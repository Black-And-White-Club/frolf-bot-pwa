import { selectors } from '../support/selectors';

export const adminScreen = {
	root() {
		return cy.contains('h1', 'Admin Dashboard').closest('div.min-h-screen');
	},
	tagSection() {
		return cy.contains('h2', 'Tag Management').closest('section');
	},
	pointSection() {
		return cy.contains('h2', 'Point Adjustment').closest('section');
	},
	tagInputs() {
		return this.tagSection().find('tbody input[type="number"]');
	},
	setTagForPlayer(displayName: string, newTag: string) {
		this.tagSection().contains('tr', displayName).find('input[type="number"]').clear().type(newTag);
	},
	submitBatchButton() {
		return this.tagSection().contains('button', 'Submit Batch');
	},
	pointMemberSelect() {
		return cy.get(selectors.pointMemberSelect);
	},
	pointDeltaInput() {
		return cy.get(selectors.pointDeltaInput);
	},
	pointReasonInput() {
		return cy.get(selectors.pointReasonInput);
	},
	adjustPointsButton() {
		return this.pointSection().contains('button', 'Adjust Points');
	}
} as const;
