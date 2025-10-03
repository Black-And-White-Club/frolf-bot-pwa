// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import RoundCard from '../RoundCard.svelte';
import type { Round } from '$lib/types/backend';

const sampleRound: Round = {
	round_id: 'r-100',
	guild_id: 'g1',
	title: 'Morning Round',
	description: 'Fun round',
	location: 'Local Park',
	start_time: new Date().toISOString(),
	status: 'scheduled',
	participants: [],
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString()
};

describe('RoundCard interactions', () => {
	it('renders and responds to click', async () => {
		const handler = vi.fn();
		const { getByTestId } = render(RoundCard, { props: { round: sampleRound, onRoundClick: handler, dataTestId: 'rc-1' } });
		const el = getByTestId('rc-1');
		await fireEvent.click(el);
		expect(handler).toHaveBeenCalledWith({ roundId: 'r-100' });
	});

	it('responds to Enter keydown as activation', async () => {
		const handler = vi.fn();
		const { getByTestId } = render(RoundCard, { props: { round: sampleRound, onRoundClick: handler, dataTestId: 'rc-2' } });
		const el = getByTestId('rc-2');
		await fireEvent.keyDown(el, { key: 'Enter' });
		expect(handler).toHaveBeenCalledWith({ roundId: 'r-100' });
	});
});
