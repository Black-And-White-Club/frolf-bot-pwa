// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import BetSlip from '$lib/components/activity/BetSlip.svelte';

describe('BetSlip', () => {
	const mockOption = { label: 'Player One', decimal_odds: 2.5 };

	it('renders nothing when selectedOption is null', () => {
		const { container } = render(BetSlip, {
			props: {
				selectedOption: null,
				availableBalance: 100,
				onPlaceBet: vi.fn()
			}
		});
		expect(container.querySelector('button')).toBeNull();
	});

	it('renders Place Bet button and stake input when option selected', () => {
		const { getByText, getByLabelText } = render(BetSlip, {
			props: {
				selectedOption: mockOption,
				availableBalance: 100,
				onPlaceBet: vi.fn()
			}
		});
		expect(getByText('Place Bet')).toBeTruthy();
		expect(getByLabelText('Stake')).toBeTruthy();
	});

	it('shows payout calculation based on stake and odds', async () => {
		const { getByLabelText, getByText } = render(BetSlip, {
			props: {
				selectedOption: mockOption,
				availableBalance: 200,
				onPlaceBet: vi.fn()
			}
		});
		const input = getByLabelText('Stake') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '40' } });
		// 40 * 2.5 = 100
		expect(getByText(/100 pts/)).toBeTruthy();
	});

	it('first click enters confirmation pending state', async () => {
		const { getByText } = render(BetSlip, {
			props: {
				selectedOption: mockOption,
				availableBalance: 100,
				onPlaceBet: vi.fn()
			}
		});
		const btn = getByText('Place Bet');
		await fireEvent.click(btn);
		expect(getByText(/Confirm:/)).toBeTruthy();
	});

	it('second click calls onPlaceBet with stake', async () => {
		const onPlaceBet = vi.fn().mockResolvedValue(undefined);
		const { getByText } = render(BetSlip, {
			props: {
				selectedOption: mockOption,
				availableBalance: 100,
				onPlaceBet
			}
		});
		const btn = getByText('Place Bet');
		await fireEvent.click(btn); // first: enter confirm
		const confirmBtn = getByText(/Confirm:/);
		await fireEvent.click(confirmBtn); // second: submit
		expect(onPlaceBet).toHaveBeenCalledWith(25); // default stake
	});

	it('shows error message when error prop is set', () => {
		const { getByText } = render(BetSlip, {
			props: {
				selectedOption: mockOption,
				availableBalance: 100,
				onPlaceBet: vi.fn(),
				error: 'Insufficient funds'
			}
		});
		expect(getByText('Insufficient funds')).toBeTruthy();
	});

	it('shows warning when stake exceeds available balance', async () => {
		const { getByLabelText, getByText } = render(BetSlip, {
			props: {
				selectedOption: mockOption,
				availableBalance: 10,
				onPlaceBet: vi.fn()
			}
		});
		const input = getByLabelText('Stake') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: '50' } });
		expect(getByText(/Not enough points/)).toBeTruthy();
	});

	it('button is disabled while placing', () => {
		const { getByText } = render(BetSlip, {
			props: {
				selectedOption: mockOption,
				availableBalance: 100,
				onPlaceBet: vi.fn(),
				placing: true
			}
		});
		const btn = getByText('Placing…').closest('button') as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});
});
