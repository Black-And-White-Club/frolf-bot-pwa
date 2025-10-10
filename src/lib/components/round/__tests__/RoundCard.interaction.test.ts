// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import RoundCard from '../RoundCard.svelte';
import type { Round } from '$lib/types/backend';

const sampleRound = {
	round_id: 'r1',
	guild_id: 'g1',
	title: 'Test Round',
	status: 'active',
	participants: [],
	par_total: 36,
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString()
} as unknown as Round;

describe('RoundCard interactions', () => {
	it('renders as button when onRoundClick provided and calls handler on click', async () => {
		const onRoundClick = vi.fn();
		const { getByTestId } = render(RoundCard, {
			round: sampleRound,
			onRoundClick,
			dataTestId: 'main-roundcard-btn'
		});
		const btn = getByTestId('main-roundcard-btn');
		await fireEvent.click(btn);
		expect(onRoundClick).toHaveBeenCalled();
	});

	it('activates on Enter and Space keyboard events', async () => {
		const onRoundClick = vi.fn();
		const { getByTestId } = render(RoundCard, {
			round: sampleRound,
			onRoundClick,
			dataTestId: 'main-roundcard-btn'
		});
		const btn = getByTestId('main-roundcard-btn');
		await fireEvent.keyDown(btn, { key: 'Enter' });
		await fireEvent.keyDown(btn, { key: ' ' });
		expect(onRoundClick).toHaveBeenCalledTimes(2);
	});
});
