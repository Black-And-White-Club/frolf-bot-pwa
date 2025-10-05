/* @vitest-environment jsdom */
import { render, fireEvent } from '@testing-library/svelte';
import { vi, test, expect } from 'vitest';

// Mock calendar and announcer utilities
vi.mock('$lib/utils/calendar', () => ({ addToCalendar: vi.fn() }));
vi.mock('$lib/stores/announcer', () => ({ announce: vi.fn() }));

import RoundHeader from '../RoundHeader.svelte';
import { addToCalendar } from '$lib/utils/calendar';
import { announce } from '$lib/stores/announcer';

const makeRound = (overrides: unknown = {}) => ({
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
	const round = makeRound();
	const { getByTestId } = render(RoundHeader, {
		props: { round: round as unknown as import('$lib/types/backend').Round }
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
