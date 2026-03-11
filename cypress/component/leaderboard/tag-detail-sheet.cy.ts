/// <reference types="cypress" />

import TagDetailSheet from '$lib/components/leaderboard/TagDetailSheet.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { tagDetailSheetComponentScreen } from '../../screens/tag-detail-sheet.component.screen';

const rawHistory = {
	guild_id: 'test-guild',
	entries: [
		{
			id: 1,
			tag_number: 7,
			old_member_id: 'member-2',
			new_member_id: 'member-1',
			reason: 'won',
			created_at: '2025-01-01T10:00:00.000Z'
		},
		{
			id: 2,
			tag_number: 8,
			old_member_id: 'member-1',
			new_member_id: 'member-3',
			reason: 'lost',
			created_at: '2025-01-02T10:00:00.000Z'
		},
		{
			id: 3,
			tag_number: 9,
			old_member_id: 'member-4',
			new_member_id: 'member-1',
			reason: 'challenge',
			created_at: '2025-01-03T10:00:00.000Z'
		}
	]
};

describe('TagDetailSheet (Component)', () => {
	beforeEach(() => {
		tagStore.selectMember(null);
		tagStore.historyLoading = false;
	});

	it('shows loading state when historyLoading is true', () => {
		tagStore.selectMember('member-1', 'test-guild');
		tagStore.historyLoading = true;

		cy.mountComponent(TagDetailSheet as any, { props: { memberId: 'member-1' } });

		tagDetailSheetComponentScreen.loadingState().should('be.visible');
		tagDetailSheetComponentScreen.historyEntries().should('not.exist');
	});

	it('shows empty state when member has no cached history', () => {
		tagStore.selectMember('member-1', 'test-guild');

		cy.mountComponent(TagDetailSheet as any, { props: { memberId: 'member-1' } });

		tagDetailSheetComponentScreen.emptyState().should('be.visible');
		tagDetailSheetComponentScreen.historyEntries().should('not.exist');
	});

	it('shows history entries from the store cache sorted most-recent-first', () => {
		tagStore.selectMember('member-1', 'test-guild');
		tagStore.applyMemberHistoryResponse('test-guild', 'member-1', rawHistory);

		cy.mountComponent(TagDetailSheet as any, { props: { memberId: 'member-1' } });

		// 3 entries (id 1 + 3 involve member-1; id 2 returned by backend but less recent)
		tagDetailSheetComponentScreen.historyEntries().should('have.length', 3);

		// most recent first (id 3, created_at 2025-01-03)
		tagDetailSheetComponentScreen.entryTag(0).should('have.text', '#9');
		tagDetailSheetComponentScreen.entryReason(0).should('have.text', 'challenge');

		tagDetailSheetComponentScreen.entryTag(1).should('have.text', '#8');
		tagDetailSheetComponentScreen.entryTag(2).should('have.text', '#7');
	});

	it('renders the inline panel (not a dialog)', () => {
		tagStore.selectMember('member-1', 'test-guild');

		cy.mountComponent(TagDetailSheet as any, { props: { memberId: 'member-1' } });

		tagDetailSheetComponentScreen.container().should('exist');
		// Confirm no dialog role (it's an inline expansion, not a modal)
		cy.get('[role="dialog"]').should('not.exist');
	});

	it('groups history entries from the same round into a single row', () => {
		const historyWithGroups = {
			guild_id: 'test-guild',
			entries: [
				{
					id: 1,
					tag_number: 7,
					old_member_id: 'member-2',
					new_member_id: 'member-1',
					reason: 'round_swap',
					round_id: 'round-1',
					created_at: '2025-01-05T10:00:00.000Z'
				},
				{
					id: 2,
					tag_number: 12,
					old_member_id: 'member-1',
					new_member_id: 'member-3',
					reason: 'round_swap',
					round_id: 'round-1',
					created_at: '2025-01-05T10:00:00.000Z' // Same round_id
				},
				{
					id: 3,
					tag_number: 5,
					old_member_id: 'member-4',
					new_member_id: 'member-1',
					reason: 'round_swap',
					round_id: 'round-2',
					created_at: '2025-01-06T10:00:00.000Z' // Different round
				}
			]
		};

		tagStore.selectMember('member-1', 'test-guild');
		tagStore.applyMemberHistoryResponse('test-guild', 'member-1', historyWithGroups);

		cy.mountComponent(TagDetailSheet as any, { props: { memberId: 'member-1' } });

		// 3 total entries, but grouped into 2 rows (round-2, then round-1)
		tagDetailSheetComponentScreen.historyEntries().should('have.length', 2);

		// First row (most recent: round-2)
		tagDetailSheetComponentScreen
			.historyEntries()
			.eq(0)
			.within(() => {
				cy.get('.entry-tag').should('contain.text', '#5');
			});

		// Second row (older: round-1)
		tagDetailSheetComponentScreen
			.historyEntries()
			.eq(1)
			.within(() => {
				cy.get('.entry-tag').should('contain.text', '#7'); // Got tag
				cy.get('.entry-tag.given').should('contain.text', '#12'); // Gave tag
			});
	});
});
