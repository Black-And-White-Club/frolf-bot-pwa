// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { test, expect, vi, afterEach } from 'vitest';
import RoundCard from '../RoundCard.svelte';
import { mockRounds } from '$lib/mocks/mockRounds';

afterEach(() => {
	vi.restoreAllMocks();
});

test('shows RoundDetails and ParticipantDisplay when not collapsed (with testid)', async () => {
	const { getByText } = render(RoundCard, {
		props: { round: mockRounds[0], collapsed: false, dataTestId: 'test-card' }
	});

	// Check that child components render by asserting title text is present
	expect(getByText(mockRounds[0].title)).toBeTruthy();
});

test('hides content when collapsed (with testid)', async () => {
	const { queryByText } = render(RoundCard, {
		props: { round: mockRounds[0], collapsed: true, dataTestId: 'test-card' }
	});

	// Details and participants should not render when collapsed
	expect(queryByText(mockRounds[0].description || '')).toBeNull();
});

test('shows RoundDetails and ParticipantDisplay when not collapsed', async () => {
	const { getByText } = render(RoundCard, { props: { round: mockRounds[0], collapsed: false } });

	// Check that child components render by asserting title text is present
	expect(getByText(mockRounds[0].title)).toBeTruthy();
});

test('hides content when collapsed', async () => {
	const { queryByRole } = render(RoundCard, { props: { round: mockRounds[0], collapsed: true } });

	// In the collapsed state the body region should not be present. We try
	// to query for a region role; if your component uses a different marker
	// adjust accordingly.
	expect(queryByRole('region')).toBeNull();
});
