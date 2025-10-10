/* @vitest-environment jsdom */

import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import RoundHeader from '../RoundHeader.svelte';
import type { Round } from '$lib/types/backend';

const makeRound = (overrides: Record<string, unknown> = {}) => ({
	round_id: 'r1',
	guild_id: 'g1',
	title: 'Test Round',
	status: 'scheduled',
	participants: [],
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	start_time: new Date().toISOString(),
	...overrides
});

test('renders title and status when scheduled', async () => {
	const round = makeRound();
	const { getByTestId } = render(RoundHeader, {
		props: { round: round as unknown as Round, showStatus: true, testid: 'header-1' }
	});
	expect(getByTestId('round-title-r1')).toBeTruthy();
	expect(getByTestId('status-r1')).toBeTruthy();
	// Calendar action lives in RoundDetails (inline button) for scheduled rounds
});

test('hides status when showStatus is false', () => {
	const round = makeRound({ status: 'completed' });
	const { queryByTestId } = render(RoundHeader, {
		props: { round: round as unknown as Round, showStatus: false }
	});
	expect(queryByTestId('status-r1')).toBeNull();
});
