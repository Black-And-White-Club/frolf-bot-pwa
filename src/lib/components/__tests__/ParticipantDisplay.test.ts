/* @vitest-environment jsdom */

import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import ParticipantDisplay from '../round/ParticipantDisplay.svelte';

import type { Round, RoundStatus, ParticipantResponse } from '$lib/types/backend';

const makeRound = (overrides: Partial<Round> = {}) => ({
	round_id: 'r1',
	guild_id: 'g1',
	title: 'R1',
	status: 'completed' as RoundStatus,
	participants: [],
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

test('renders initials when no avatar_url and shows DNP for completed', () => {
	const round = makeRound({
		participants: [{ user_id: 'u1', username: 'Sam', response: 'no' as ParticipantResponse }],
		status: 'completed'
	});
	const { getByText } = render(ParticipantDisplay, { props: { round } });
	expect(getByText('S')).toBeTruthy();
	// Accept exact 'DNP' or variations with surrounding whitespace
	expect(getByText(/DNP/)).toBeTruthy();
});

test('renders avatar image when avatar_url present and shows score when present', () => {
	const round = makeRound({
		participants: [
			{
				user_id: 'u2',
				username: 'Dana',
				avatar_url: 'http://example.com/a.png',
				score: 12,
				response: 'yes' as ParticipantResponse
			}
		],
		status: 'active'
	});
	const { container, getByText } = render(ParticipantDisplay, { props: { round } });
	const img = container.querySelector('img');
	expect(img).toBeTruthy();
	// Accept numbers with or without a leading + sign (e.g., '+12' or '12')
	expect(getByText(/\+?12/)).toBeTruthy();
});

test('compact view shows stacked avatars and count', () => {
	const participants = [
		{ user_id: 'u1', username: 'A', response: 'yes' as ParticipantResponse },
		{ user_id: 'u2', username: 'B', response: 'yes' as ParticipantResponse },
		{ user_id: 'u3', username: 'C', response: 'yes' as ParticipantResponse },
		{ user_id: 'u4', username: 'D', response: 'yes' as ParticipantResponse }
	];
	const round = makeRound({ participants, status: 'scheduled' });
	const { getByText } = render(ParticipantDisplay, { props: { round, compact: true } });
	expect(getByText('4 players')).toBeTruthy();
});
