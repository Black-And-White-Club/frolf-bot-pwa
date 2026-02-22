/// <reference types="cypress" />

import RoundList from '$lib/components/round/RoundList.svelte';
import { roundService, type Round } from '$lib/stores/round.svelte';
import { roundListComponentScreen } from '../../screens/round-list.component.screen';

function buildRound({
	id,
	state,
	title
}: {
	id: string;
	state: Round['state'];
	title: string;
}): Round {
	return {
		id,
		guildId: 'guild-1',
		title,
		location: 'Test Course',
		description: 'CT Round',
		startTime: '2025-02-22T10:00:00.000Z',
		state,
		createdBy: 'user-1',
		eventMessageId: `event-${id}`,
		participants: []
	};
}

describe('RoundList (Component)', () => {
	beforeEach(() => {
		roundService.clear();
		roundService.setRounds([
			buildRound({ id: 'round-live', state: 'started', title: 'Live Round' }),
			buildRound({
				id: 'round-upcoming',
				state: 'scheduled',
				title: 'Upcoming Round'
			}),
			buildRound({
				id: 'round-completed',
				state: 'finalized',
				title: 'Completed Round'
			})
		]);
	});

	afterEach(() => {
		roundService.clear();
	});

	it('collapses and expands round sections using the chevron control', () => {
		cy.mountComponent(RoundList);

		roundListComponentScreen.sectionBySlug('live-rounds').should('be.visible');
		roundListComponentScreen
			.chevronBySlug('live-rounds')
			.should('have.attr', 'aria-expanded', 'true');
		roundListComponentScreen.roundCardById('round-live').should('be.visible');

		roundListComponentScreen.chevronBySlug('live-rounds').click();
		roundListComponentScreen
			.chevronBySlug('live-rounds')
			.should('have.attr', 'aria-expanded', 'false');
		roundListComponentScreen.roundCardById('round-live').should('not.exist');

		roundListComponentScreen.chevronBySlug('live-rounds').click();
		roundListComponentScreen.roundCardById('round-live').should('be.visible');
	});

	it('calls onSelect when a round card is clicked', () => {
		const onSelect = cy.stub().as('onSelect');
		cy.mountComponent(RoundList, {
			props: { onSelect }
		});

		roundListComponentScreen.roundCardById('round-live').click();
		cy.get('@onSelect').should('have.been.calledWith', 'round-live');
	});
});
