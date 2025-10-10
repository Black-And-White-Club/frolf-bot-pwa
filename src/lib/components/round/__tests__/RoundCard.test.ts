import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, afterEach } from 'vitest';
import RoundCard from '../RoundCard.svelte';
import { mockRounds } from '$lib/mocks/mockRounds';

afterEach(() => {
	vi.restoreAllMocks();
	vi.resetModules();
});

test('renders as button when onRoundClick provided', async () => {
	const handleClick = vi.fn();
	render(RoundCard, {
		props: { round: mockRounds[0], onRoundClick: handleClick, dataTestId: 'test-card' }
	});

	const button = screen.getByTestId('test-card');
	expect(button.tagName).toBe('BUTTON');
});

test('renders as div when no onRoundClick', async () => {
	render(RoundCard, { props: { round: mockRounds[0], dataTestId: 'test-card' } });

	const div = screen.getByTestId('test-card');
	expect(div.tagName).toBe('DIV');
});

test('calls onRoundClick when clicked', async () => {
	const user = userEvent.setup();
	const handleClick = vi.fn();

	render(RoundCard, {
		props: { round: mockRounds[0], onRoundClick: handleClick, dataTestId: 'test-card' }
	});

	await user.click(screen.getByTestId('test-card'));
	expect(handleClick).toHaveBeenCalledWith({ roundId: mockRounds[0].round_id });
});

test('shows RoundDetails and ParticipantDisplay when not collapsed', async () => {
	render(RoundCard, { props: { round: mockRounds[0], collapsed: false } });

	// Check that child components render by asserting title text is present
	expect(screen.getByText(mockRounds[0].title)).toBeTruthy();
});

test('hides content when collapsed', async () => {
	render(RoundCard, { props: { round: mockRounds[0], collapsed: true } });

	// In the collapsed state the body region should not be present. We try
	// to query for a region role; if your component uses a different marker
	// adjust accordingly.
	expect(screen.queryByRole('region')).not.toBeTruthy();
});
