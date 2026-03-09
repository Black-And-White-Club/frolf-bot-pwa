/// <reference types="cypress" />

import TagLeaderboard from '$lib/components/leaderboard/TagLeaderboard.svelte';
import { auth } from '$lib/stores/auth.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { tagLeaderboardComponentScreen } from '../../screens/tag-leaderboard.component.screen';

const members = [
	{ memberId: 'member-1', currentTag: 1 },
	{ memberId: 'member-2', currentTag: 2 },
	{ memberId: 'member-3', currentTag: 3 }
];

const cachedHistory = {
	guild_id: 'test-guild',
	entries: [
		{
			id: 1,
			tag_number: 7,
			new_member_id: 'member-1',
			reason: 'won',
			created_at: '2025-01-01T10:00:00.000Z'
		}
	]
};

describe('TagLeaderboard row expansion', () => {
	beforeEach(() => {
		// Reset store state
		auth.user = {
			id: 'discord-1',
			uuid: 'user-1',
			activeClubUuid: 'test-guild',
			guildId: 'legacy-guild',
			role: 'player',
			clubs: [],
			linkedProviders: []
		};
		tagStore.selectMember(null);
		tagStore.historyLoading = false;
		// Pre-populate cache so the panel has data to show immediately
		tagStore.applyMemberHistoryResponse('member-1', cachedHistory);
		tagStore.applyMemberHistoryResponse('member-2', { guild_id: 'test-guild', entries: [] });
		tagStore.applyMemberHistoryResponse('member-3', { guild_id: 'test-guild', entries: [] });
		// Stub fetchTagHistory so no NATS calls are made
		cy.stub(tagStore, 'fetchTagHistory').resolves();
	});

	afterEach(() => {
		auth.user = null;
	});

	it('history panel is not shown on initial render', () => {
		cy.mountComponent(TagLeaderboard, { props: { members } });

		tagLeaderboardComponentScreen.expandedPanel().should('not.exist');
	});

	it('clicking history button expands the panel for that row', () => {
		cy.mountComponent(TagLeaderboard, { props: { members } });

		tagLeaderboardComponentScreen.historyBtn('member-1').click();

		tagLeaderboardComponentScreen.expandedPanel().should('be.visible');
		tagLeaderboardComponentScreen.historyBtn('member-1').should('have.attr', 'aria-expanded', 'true');
	});

	it('clicking the same history button again collapses the panel', () => {
		cy.mountComponent(TagLeaderboard, { props: { members } });

		tagLeaderboardComponentScreen.historyBtn('member-1').click();
		tagLeaderboardComponentScreen.expandedPanel().should('exist');

		tagLeaderboardComponentScreen.historyBtn('member-1').click();
		tagLeaderboardComponentScreen.expandedPanel().should('not.exist');
		tagLeaderboardComponentScreen.historyBtn('member-1').should('have.attr', 'aria-expanded', 'false');
	});

	it('switching to a different row collapses the first and expands the second', () => {
		cy.mountComponent(TagLeaderboard, { props: { members } });

		tagLeaderboardComponentScreen.historyBtn('member-1').click();
		tagLeaderboardComponentScreen.expandedPanel().should('exist');

		tagLeaderboardComponentScreen.historyBtn('member-2').click();

		// Only one panel open at a time
		tagLeaderboardComponentScreen.expandedPanel().should('have.length', 1);
		tagLeaderboardComponentScreen.historyBtn('member-1').should('have.attr', 'aria-expanded', 'false');
		tagLeaderboardComponentScreen.historyBtn('member-2').should('have.attr', 'aria-expanded', 'true');
	});

	it('pressing Escape collapses the open panel', () => {
		cy.mountComponent(TagLeaderboard, { props: { members } });

		tagLeaderboardComponentScreen.historyBtn('member-1').click();
		tagLeaderboardComponentScreen.expandedPanel().should('exist');

		cy.window().trigger('keydown', { key: 'Escape' });

		tagLeaderboardComponentScreen.expandedPanel().should('not.exist');
	});

	it('aria-label on history button reflects the open/closed state', () => {
		cy.mountComponent(TagLeaderboard, { props: { members } });

		tagLeaderboardComponentScreen
			.historyBtn('member-1')
			.should('have.attr', 'aria-label', 'View Tag History');

		tagLeaderboardComponentScreen.historyBtn('member-1').click();

		tagLeaderboardComponentScreen
			.historyBtn('member-1')
			.should('have.attr', 'aria-label', 'Hide Tag History');
	});

	it('fetchTagHistory is called when expanding a row', () => {
		cy.mountComponent(TagLeaderboard, { props: { members } });

		// member-2's cache is pre-populated but the fetch should still be called
		// (cache hit skipping is handled in the store, not the component)
		tagLeaderboardComponentScreen.historyBtn('member-2').click();

		cy.wrap(tagStore.fetchTagHistory).should('have.been.called');
	});

	it('fetchTagHistory is called with Discord guild ID, not club UUID', () => {
		cy.mountComponent(TagLeaderboard, { props: { members } });

		tagLeaderboardComponentScreen.historyBtn('member-1').click();

		// Should use auth.user.guildId ('legacy-guild') not activeClubUuid ('test-guild')
		cy.wrap(tagStore.fetchTagHistory).should('have.been.calledWith', 'legacy-guild', 'member-1');
	});
});
