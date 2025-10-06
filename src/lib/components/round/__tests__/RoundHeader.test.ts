/* @vitest-environment jsdom */
/* @vitest-environment jsdom */

import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import RoundHeader from '../RoundHeader.svelte';
import type { Round } from '$lib/types/backend';

// Interaction tests (previously in RoundHeader.interaction.test.ts)
import { fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';

// Mock calendar and announcer utilities
vi.mock('$lib/utils/calendar', () => ({ addToCalendar: vi.fn() }));
vi.mock('$lib/stores/announcer', () => ({ announce: vi.fn() }));

import { addToCalendar } from '$lib/utils/calendar';
import { announce } from '$lib/stores/announcer';

const makeRoundWithStart = (overrides: unknown = {}) => ({
	round_id: 'r-int',
	guild_id: 'g1',
	title: 'Interaction Round',
	status: 'scheduled',
	participants: [],
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	start_time: new Date().toISOString(),
	...(overrides as Record<string, unknown>)
});

test('click and keyboard handlers call addToCalendar and announce', async () => {
	const round = makeRoundWithStart();
	const { getByTestId } = render(RoundHeader, {
		props: { round: round as unknown as Round }
	});

	const btn = getByTestId('btn-add-calendar-r-int');
	await fireEvent.click(btn);
	expect(addToCalendar).toHaveBeenCalledWith(expect.objectContaining({ round_id: 'r-int' }));
	expect(announce).toHaveBeenCalledWith('Added to calendar');

	// keyboard: Enter
	await fireEvent.keyDown(btn, { key: 'Enter' });
	expect(addToCalendar).toHaveBeenCalled();
	expect(announce).toHaveBeenCalled();
});

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

test('renders title and status and add-to-calendar when scheduled', async () => {
	const round = makeRound();
	const { getByTestId } = render(RoundHeader, {
		props: { round: round as unknown as Round, showStatus: true, testid: 'header-1' }
	});
	expect(getByTestId('round-title-r1')).toBeTruthy();
	expect(getByTestId('status-r1')).toBeTruthy();
	expect(getByTestId('btn-add-calendar-r1')).toBeTruthy();
});

test('hides status when showStatus is false', () => {
	const round = makeRound({ status: 'completed' });
	const { queryByTestId } = render(RoundHeader, {
		props: { round: round as unknown as Round, showStatus: false }
	});
	expect(queryByTestId('status-r1')).toBeNull();
});
