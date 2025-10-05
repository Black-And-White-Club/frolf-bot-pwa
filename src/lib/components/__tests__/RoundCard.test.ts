/* @vitest-environment jsdom */
/* @vitest-environment jsdom */
import { render, fireEvent } from '@testing-library/svelte';
import { test, expect, vi } from 'vitest';
import RoundCard from '../RoundCard.svelte';
import type { Round } from '$lib/types/backend';

const makeRound = (): Round => ({
	round_id: 'r1',
	guild_id: 'g1',
	title: 'Test Round',
	status: 'scheduled',
	participants: [],
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString()
});

test('renders round and calls onRoundClick when clicked', async () => {
	const round = makeRound();
	const onRoundClick = vi.fn();
	const { getByTestId } = render(RoundCard, { props: { round, onRoundClick, dataTestId: 'rc-1' } });
	const card = getByTestId('rc-1');
	await fireEvent.click(card);
	expect(onRoundClick).toHaveBeenCalled();
});
