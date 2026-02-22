/// <reference types="cypress" />

import TagDetailSheet from '$lib/components/leaderboard/TagDetailSheet.svelte';
import { tagDetailSheetComponentScreen } from '../../screens/tag-detail-sheet.component.screen';

describe('TagDetailSheet (Component)', () => {
	const history = [
		{
			id: 1,
			tagNumber: 7,
			oldMemberId: 'member-2',
			newMemberId: 'member-1',
			reason: 'won',
			createdAt: '2025-01-01T10:00:00.000Z'
		},
		{
			id: 2,
			tagNumber: 8,
			oldMemberId: 'member-1',
			newMemberId: 'member-3',
			reason: 'lost',
			createdAt: '2025-01-02T10:00:00.000Z'
		},
		{
			id: 3,
			tagNumber: 9,
			oldMemberId: 'member-4',
			newMemberId: 'member-1',
			reason: 'challenge',
			createdAt: '2025-01-03T10:00:00.000Z'
		},
		{
			id: 4,
			tagNumber: 10,
			oldMemberId: 'member-5',
			newMemberId: 'member-6',
			reason: 'unrelated',
			createdAt: '2025-01-04T10:00:00.000Z'
		}
	];

	it('filters to selected member and sorts by most recent first', () => {
		cy.mountComponent(TagDetailSheet, {
			props: {
				memberId: 'member-1',
				history
			}
		});

		tagDetailSheetComponentScreen.dialog().should('be.visible');
		tagDetailSheetComponentScreen.historyEntries().should('have.length', 3);
		tagDetailSheetComponentScreen.entryTag(0).should('have.text', '#9');
		tagDetailSheetComponentScreen.entryReason(0).should('have.text', 'challenge');
		tagDetailSheetComponentScreen.entryTag(1).should('have.text', '#8');
		tagDetailSheetComponentScreen.entryTag(2).should('have.text', '#7');
	});

	it('calls onClose on Escape key and close button click', () => {
		const onClose = cy.stub().as('onClose');
		cy.mountComponent(TagDetailSheet, {
			props: {
				memberId: 'member-1',
				history,
				onClose
			}
		});

		tagDetailSheetComponentScreen.dialog().focus().trigger('keydown', { key: 'Escape' });
		cy.get('@onClose').should('have.been.calledOnce');

		tagDetailSheetComponentScreen.closeButton().click();
		cy.get('@onClose').should('have.been.calledTwice');
	});
});
