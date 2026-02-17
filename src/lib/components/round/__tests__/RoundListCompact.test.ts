// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import RoundListCompact from '../RoundListCompact.svelte';

// Mock dependencies
vi.mock('$lib/stores/round.svelte', () => ({
	roundService: {
		rounds: [],
		isLoading: false
	}
}));

describe('RoundListCompact', () => {
	it('renders', () => {
		const { container } = render(RoundListCompact, { props: { rounds: [] } });
		expect(container).toBeTruthy();
	});
});
