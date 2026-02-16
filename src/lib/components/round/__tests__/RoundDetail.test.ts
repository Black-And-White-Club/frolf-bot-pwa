// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import RoundDetail from '../RoundDetail.svelte';

// Mock dependencies
vi.mock('$lib/stores/round.svelte', () => ({
	roundService: {
		rounds: [
			{
				id: '123',
				title: 'Test Round',
				state: 'scheduled',
				startTime: new Date().toISOString(),
				participants: [],
				holes: 18,
				currentHole: 0
			}
		],
		isLoading: false
	}
}));

vi.mock('$lib/stores/userProfiles.svelte', () => ({
	userProfiles: {
		getDisplayName: () => 'Test User'
	}
}));

describe('RoundDetail', () => {
	it('renders round details', () => {
		const { getByText } = render(RoundDetail, { props: { roundId: '123' } });
		expect(getByText('Test Round')).toBeTruthy();
	});

	it('shows empty state when round not found', () => {
		const { getByText } = render(RoundDetail, { props: { roundId: '999' } });
		expect(getByText('Round not found')).toBeTruthy();
	});
});
