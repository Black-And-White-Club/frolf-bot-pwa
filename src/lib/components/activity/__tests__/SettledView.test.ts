// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettledView from '$lib/components/activity/SettledView.svelte';
import type { BettingMarketSettledPayload } from '$lib/stores/activity-betting.svelte';

const mockPayload: BettingMarketSettledPayload = {
	club_uuid: 'club-1',
	market_id: 1,
	result_summary: 'Player One wins!',
	winning_options: ['player-1']
} as any;

const mockPayoutJournal = [
	{ entry_type: 'bet_payout', amount: 150, reason: 'Winner payout', created_at: '' }
] as any[];

describe('SettledView', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders "Market Settled!" headline', () => {
		const { getByText } = render(SettledView, {
			props: { payload: mockPayload, journal: [], onDismiss: vi.fn() }
		});
		expect(getByText('Market Settled!')).toBeTruthy();
	});

	it('shows result_summary when provided', () => {
		const { getByText } = render(SettledView, {
			props: { payload: mockPayload, journal: [], onDismiss: vi.fn() }
		});
		expect(getByText('Player One wins!')).toBeTruthy();
	});

	it('countdown starts at 20', () => {
		const { getByText } = render(SettledView, {
			props: { payload: mockPayload, journal: [], onDismiss: vi.fn() }
		});
		expect(getByText(/\(20\)/)).toBeTruthy();
	});

	it('countdown decrements each second', async () => {
		const { getByText } = render(SettledView, {
			props: { payload: mockPayload, journal: [], onDismiss: vi.fn() }
		});
		await vi.advanceTimersByTimeAsync(3000);
		expect(getByText(/\(17\)/)).toBeTruthy();
	});

	it('calls onDismiss after 20 seconds', async () => {
		const onDismiss = vi.fn();
		render(SettledView, {
			props: { payload: mockPayload, journal: [], onDismiss }
		});
		vi.advanceTimersByTime(20000);
		expect(onDismiss).toHaveBeenCalled();
	});

	it('calls onDismiss when Continue button is clicked', async () => {
		const onDismiss = vi.fn();
		const { getByText } = render(SettledView, {
			props: { payload: mockPayload, journal: [], onDismiss }
		});
		await fireEvent.click(getByText(/Continue/));
		expect(onDismiss).toHaveBeenCalled();
	});

	it('shows payout journal entries', () => {
		const { getByText, getAllByText } = render(SettledView, {
			props: { payload: mockPayload, journal: mockPayoutJournal, onDismiss: vi.fn() }
		});
		expect(getByText('Winner payout')).toBeTruthy();
		// "+150 pts" appears in both the entry row and the total row
		expect(getAllByText(/\+150 pts/).length).toBeGreaterThanOrEqual(1);
	});

	it('shows win trophy icon when total payout is positive', () => {
		const { container } = render(SettledView, {
			props: { payload: mockPayload, journal: mockPayoutJournal, onDismiss: vi.fn() }
		});
		expect(container.textContent).toContain('🏆');
	});

	it('shows par icon when no payout', () => {
		const { container } = render(SettledView, {
			props: { payload: mockPayload, journal: [], onDismiss: vi.fn() }
		});
		expect(container.textContent).toContain('⛳');
	});

	it('does not render payout section when journal is empty', () => {
		const { container } = render(SettledView, {
			props: { payload: mockPayload, journal: [], onDismiss: vi.fn() }
		});
		expect(container.querySelector('.max-w-xs')).toBeNull();
	});
});
