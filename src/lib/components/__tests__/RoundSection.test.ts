import { render } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import RoundSection from '../RoundSection.svelte';

const minimalRound: {
	round_id: string;
	guild_id: string;
	status: string;
	participants: unknown[];
	created_by: string;
	title: string;
	created_at: string;
	updated_at: string;
} = {
	round_id: 'r1',
	guild_id: 'g1',
	status: 'active',
	participants: [],
	created_by: 'u1',
	title: 'Test Round',
	created_at: '2023-01-01T00:00:00.000Z',
	updated_at: '2023-01-01T00:00:00.000Z'
};

test('renders header and badges and round loaders', () => {
	const { getByText, container } = render(RoundSection, {
		props: {
			title: 'Upcoming',
			rounds: [minimalRound] as unknown as import('$lib/types/backend').Round[],
			badges: [{ label: 'My Badge', color: 'secondary' }],
			onRoundClick: (() => {}) as unknown as (payload: { roundId: string }) => void
		}
	});

	expect(getByText('Upcoming')).toBeTruthy();
	expect(getByText('My Badge')).toBeTruthy();
	// Should render a round-card loader placeholder (round-placeholder class)
	expect(container.querySelector('.round-placeholder')).toBeTruthy();
});
