// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
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
	it('can toggle collapsed state', async () => {
		const { rerender, getByText, container } = render(RoundCard, {
			props: { round: sampleRound, collapsed: false }
		});

		// Header/title should always be present
		expect(getByText(sampleRound.title)).toBeTruthy();

		// The body is rendered when collapsed=false
		expect(container.querySelector('.round-card-body')).toBeTruthy();

		await rerender({ round: sampleRound, collapsed: true });
		// body should be removed when collapsed=true
		expect(container.querySelector('.round-card-body')).toBeNull();
	});

	it('shows compact view', () => {
		const { getByText } = render(RoundCard, {
			props: { round: sampleRound, compact: true }
		});

		// Compact mode should still show title
		expect(getByText(sampleRound.title)).toBeTruthy();
	});
});
