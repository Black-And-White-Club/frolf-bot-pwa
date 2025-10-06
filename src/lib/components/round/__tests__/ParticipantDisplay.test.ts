/* @vitest-environment jsdom */
import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import ParticipantDisplay from '../ParticipantDisplay.svelte';
import type { Round } from '$lib/types/backend';

const makeRound = (overrides?: Partial<Round>): Round =>
	({
		round_id: 'r-1',
		guild_id: 'g1',
		title: 'Test Round',
		status: 'scheduled',
		participants: [],
		created_by: 'u1',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		start_time: new Date().toISOString(),
		...overrides
	}) as unknown as Round;

test('shows avatars when avatar_url present and score displayed when present', () => {
	const round = makeRound({
		participants: [
			{
				user_id: 'u1',
				username: 'alice',
				avatar_url: 'https://example.com/a.png',
				response: 'yes',
				score: 10
			},
			{ user_id: 'u2', username: 'bob', avatar_url: undefined, response: 'yes' }
		],
		status: 'active'
	});

	const { getByAltText, getByText } = render(ParticipantDisplay, {
		props: { round, compact: false, testid: 'pd-1' }
	});

	expect(getByAltText('alice')).toBeTruthy();
	expect(getByText('10')).toBeTruthy();
	// bob has no avatar; should show initial letter
	expect(getByText('B')).toBeTruthy();
});

test('shows DNP when no score and round not active', () => {
	const round = makeRound({
		status: 'completed',
		participants: [{ user_id: 'u3', username: 'carol', avatar_url: undefined, response: 'no' }]
	});

	const { getByText } = render(ParticipantDisplay, {
		props: { round, compact: false, testid: 'pd-2' }
	});

	expect(getByText('DNP')).toBeTruthy();
});

test('shows dash when no score and round active', () => {
	const round = makeRound({
		status: 'active',
		participants: [{ user_id: 'u4', username: 'dan', avatar_url: undefined, response: 'yes' }]
	});

	const { getByText } = render(ParticipantDisplay, {
		props: { round, compact: false, testid: 'pd-3' }
	});

	expect(getByText('-')).toBeTruthy();
});

test('compact view shows aggregated avatars and scored count', () => {
	const round = makeRound({
		status: 'active',
		participants: [
			{ user_id: 'u5', username: 'a', avatar_url: undefined, response: 'yes', score: 1 },
			{ user_id: 'u6', username: 'b', avatar_url: undefined, response: 'yes' },
			{ user_id: 'u7', username: 'c', avatar_url: undefined, response: 'yes', score: 2 },
			{ user_id: 'u8', username: 'd', avatar_url: undefined, response: 'no' }
		]
	});

	const { getByText } = render(ParticipantDisplay, {
		props: { round, compact: true, testid: 'pd-4' }
	});

	// should show total players
	expect(getByText('4 players')).toBeTruthy();
	// should show 'scored' count (2)
	expect(getByText(/2\s*scored/)).toBeTruthy();
});

test('shows "more players" when > 4 participants in non-compact view', () => {
	const round = makeRound({
		participants: [
			{ user_id: 'u1', username: 'p1', response: 'yes' },
			{ user_id: 'u2', username: 'p2', response: 'yes' },
			{ user_id: 'u3', username: 'p3', response: 'yes' },
			{ user_id: 'u4', username: 'p4', response: 'yes' },
			{ user_id: 'u5', username: 'p5', response: 'yes' }
		]
	});

	const { getByText } = render(ParticipantDisplay, {
		props: { round, compact: false, testid: 'pd-5' }
	});
	expect(getByText(/\+1 more players/)).toBeTruthy();
});
