export const tagDetailSheetComponentScreen = {
	dialog() {
		return cy.get('[role="dialog"][aria-label^="Tag History"]');
	},
	closeButton() {
		return this.dialog().find('button[aria-label="Close"]');
	},
	historyEntries() {
		return this.dialog().find('.history-entry');
	},
	entryTag(index: number) {
		return this.historyEntries().eq(index).find('.entry-tag');
	},
	entryReason(index: number) {
		return this.historyEntries().eq(index).find('.entry-reason');
	}
} as const;
