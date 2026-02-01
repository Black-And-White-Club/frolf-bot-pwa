/* @vitest-environment jsdom */

import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import RoundDetails from '../RoundDetails.svelte';
import type { RoundStatus } from '$lib/types/backend';

const baseRound = {
	round_id: 'r1',
	guild_id: 'g1',
	title: 'Test Round',
	status: 'scheduled' as RoundStatus,
	participants: [],
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString()
};

test('renders description and location when present', () => {
	const round = { ...baseRound, description: 'Lovely course', location: 'Green Park' };
	const { getByText } = render(RoundDetails, { props: { round } });
	getByText('Lovely course');
	getByText('Green Park');
});

test('compact hides description/location and shows TBD when no start_time', () => {
	const round = { ...baseRound };
	const { getByText, queryByText } = render(RoundDetails, { props: { round, compact: true } });
	// compact mode should not render description/location
	expect(queryByText('Lovely course')).toBeNull();
	// start_time not provided -> TBD
	getByText('TBD');
});
