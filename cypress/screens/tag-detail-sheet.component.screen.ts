export const tagDetailSheetComponentScreen = {
	container() {
		return cy.get('.tag-detail-inline');
	},
	historyEntries() {
		return cy.get('.history-group');
	},
	loadingState() {
		return cy.contains('.empty-state', 'Loading history...');
	},
	emptyState() {
		return cy.contains('.empty-state', 'No tag history available.');
	},
	entryTag(index: number) {
		return this.historyEntries().eq(index).find('.entry-tag');
	},
	entryReason(index: number) {
		return this.historyEntries().eq(index).find('.entry-reason');
	}
} as const;
