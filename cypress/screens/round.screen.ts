import { selectors } from '../support/selectors';

function roundCardSelector(roundId: string): string {
	return `${selectors.roundCard}[data-round-id="${roundId}"]`;
}

export const roundScreen = {
	cards() {
		return cy.get(selectors.roundCard);
	},
	cardById(roundId: string) {
		return cy.get(roundCardSelector(roundId));
	},
	expectCardVisible(roundId: string) {
		this.cardById(roundId).should('be.visible');
	},
	expectCardContains(roundId: string, value: string) {
		this.cardById(roundId).should('contain', value);
	},
	expectCardState(roundId: string, state: string) {
		this.cardById(roundId).should('have.attr', 'data-state', state);
	},
	expectParticipantLabel(roundId: string, participantCount: number) {
		this.cardById(roundId).within(() => {
			cy.contains(new RegExp(`${participantCount} player`, 'i')).should('exist');
		});
	},
	expectCardMissing(roundId: string) {
		this.cardById(roundId).should('not.exist');
	}
} as const;
