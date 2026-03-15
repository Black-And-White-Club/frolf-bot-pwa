export const bettingScreen = {
	accessBadge() {
		return cy
			.get('.rounded-full.border')
			.contains(/enabled|frozen|disabled/i)
			.first();
	},

	accessTitle() {
		return cy.contains(/Betting Enabled|Betting Frozen|Betting Locked/i);
	},

	lockedMessage() {
		return cy.contains('Betting is not enabled for this club');
	},

	walletSection() {
		return cy.contains('Available Wallet').closest('section, div.grid');
	},

	availableWalletCard() {
		return cy.contains('Available Wallet').parent();
	},

	nextMarketSection() {
		return cy.contains('Next Market').first().parents('.rounded-3xl').first();
	},

	journalSection() {
		return cy.contains('Wallet Journal').first().parents('.rounded-3xl').first();
	},

	betForm() {
		return cy
			.get('form')
			.contains(/Place Bet|Placing/i)
			.closest('form');
	},

	placeButton() {
		return cy.contains('button', /Place Bet|Placing/i);
	},

	stakeInput() {
		return cy.get('input[type="number"]').first();
	},

	frozenNote() {
		return cy.contains('Bet placement is locked while betting access is frozen');
	},

	noEligibleRound() {
		return cy.contains('No upcoming round currently has enough accepted');
	},

	marketOption(label: string) {
		return cy.contains(label).closest('label');
	},

	sourceCard() {
		return cy.contains('Source').parent();
	}
} as const;
