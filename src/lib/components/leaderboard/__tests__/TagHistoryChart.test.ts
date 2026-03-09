/* @vitest-environment jsdom */

import { render, cleanup } from '@testing-library/svelte';
import { describe, test, expect, vi, afterEach } from 'vitest';
import TagHistoryChart from '../TagHistoryChart.svelte';
import type { TagHistoryEntry } from '$lib/stores/tags.svelte';

// LayerChart uses ResizeObserver and DOM measurements that don't exist in jsdom.
// Mock the entire library so we can test our component logic in isolation.
vi.mock('layerchart', () => ({
	Chart: vi.fn(),
	Svg: vi.fn(),
	Area: vi.fn(),
	Spline: vi.fn()
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(
	id: number,
	tagNumber: number,
	daysAgo: number,
	memberId = 'user-a',
	oldMemberId = 'user-b'
): TagHistoryEntry {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	return {
		id,
		tagNumber,
		newMemberId: memberId,
		oldMemberId,
		reason: 'round_swap',
		createdAt: d.toISOString()
	};
}

const ME = 'user-a';

afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// Empty / insufficient data
// ---------------------------------------------------------------------------

describe('empty / insufficient data', () => {
	test('shows empty message when history is empty', () => {
		const { getByText } = render(TagHistoryChart, { props: { history: [], memberId: ME } });
		expect(getByText('Not enough history yet.')).toBeTruthy();
	});

	test('shows empty message when only one entry for member', () => {
		const history = [makeEntry(1, 10, 5, ME)];
		const { getByText } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(getByText('Not enough history yet.')).toBeTruthy();
	});

	test('shows empty message when entries exist but none match memberId', () => {
		const history = [makeEntry(1, 10, 5, 'other-user'), makeEntry(2, 8, 2, 'other-user')];
		const { getByText } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(getByText('Not enough history yet.')).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// Chart rendering
// ---------------------------------------------------------------------------

describe('chart rendering', () => {
	test('renders chart wrapper when member has 2+ entries', () => {
		const history = [makeEntry(1, 20, 10, ME), makeEntry(2, 15, 3, ME)];
		const { container } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(container.querySelector('.chart-wrap')).toBeTruthy();
	});

	test('does not render empty message when enough data', () => {
		const history = [makeEntry(1, 20, 10, ME), makeEntry(2, 15, 3, ME)];
		const { queryByText } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(queryByText('Not enough history yet.')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// memberId filtering
// ---------------------------------------------------------------------------

describe('memberId filtering', () => {
	test('filters to only the specified member — counts their entries', () => {
		const history = [
			makeEntry(1, 30, 20, ME),
			makeEntry(2, 25, 14, ME),
			// Other member's entries — should be ignored
			makeEntry(3, 5, 10, 'user-other'),
			makeEntry(4, 3, 5, 'user-other')
		];
		// ME has 2 entries → chart renders
		const { container } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(container.querySelector('.chart-wrap')).toBeTruthy();
	});

	test('shows empty state when only other members have enough entries', () => {
		const history = [
			makeEntry(1, 5, 10, 'user-other'),
			makeEntry(2, 3, 5, 'user-other'),
			makeEntry(3, 1, 2, 'user-other'),
			// ME has only one entry
			makeEntry(4, 20, 1, ME)
		];
		const { getByText } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(getByText('Not enough history yet.')).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// Data transformation (chartData derived)
// ---------------------------------------------------------------------------

describe('data transformation', () => {
	test('handles entries out of chronological order without crashing', () => {
		// Newest entry first in array — component must sort before rendering
		const history = [
			makeEntry(2, 15, 1, ME), // newer
			makeEntry(1, 30, 20, ME) // older
		];
		const { container } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(container.querySelector('.chart-wrap')).toBeTruthy();
	});

	test('handles identical timestamps (edge case) without crashing', () => {
		const iso = new Date().toISOString();
		const history: TagHistoryEntry[] = [
			{ id: 1, tagNumber: 10, newMemberId: ME, oldMemberId: 'x', reason: 'round_swap', createdAt: iso },
			{ id: 2, tagNumber: 8, newMemberId: ME, oldMemberId: 'y', reason: 'round_swap', createdAt: iso }
		];
		const { container } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(container.querySelector('.chart-wrap')).toBeTruthy();
	});

	test('handles all same tag number (no range) without crashing', () => {
		const history = [makeEntry(1, 5, 10, ME), makeEntry(2, 5, 3, ME)];
		const { container } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(container.querySelector('.chart-wrap')).toBeTruthy();
	});

	test('handles large number of entries', () => {
		const history = Array.from({ length: 50 }, (_, i) =>
			makeEntry(i + 1, 50 - i, i * 2, ME)
		);
		const { container } = render(TagHistoryChart, { props: { history, memberId: ME } });
		expect(container.querySelector('.chart-wrap')).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// Props update (reactivity)
// ---------------------------------------------------------------------------

describe('reactivity', () => {
	test('transitions from empty to chart when history gains a second entry', async () => {
		const oneEntry = [makeEntry(1, 20, 5, ME)];
		const { getByText, rerender } = render(TagHistoryChart, {
			props: { history: oneEntry, memberId: ME }
		});
		expect(getByText('Not enough history yet.')).toBeTruthy();

		await rerender({ history: [...oneEntry, makeEntry(2, 15, 1, ME)], memberId: ME });
		// After rerender, chart should be visible instead
		// (empty text should be gone)
		expect(() => getByText('Not enough history yet.')).toThrow();
	});

	test('transitions from chart to empty when memberId changes to one with no history', async () => {
		const history = [makeEntry(1, 20, 5, ME), makeEntry(2, 15, 1, ME)];
		const { rerender, getByText, queryByText } = render(TagHistoryChart, {
			props: { history, memberId: ME }
		});
		expect(queryByText('Not enough history yet.')).toBeNull();

		await rerender({ history, memberId: 'user-with-no-entries' });
		expect(getByText('Not enough history yet.')).toBeTruthy();
	});
});
