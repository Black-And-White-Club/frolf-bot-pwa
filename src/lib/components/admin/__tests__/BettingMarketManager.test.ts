// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BettingMarketManager from '../BettingMarketManager.svelte';
import type { AdminBettingMarket } from '$lib/stores/admin.svelte';

const { mockAdminStore, mockAuth } = vi.hoisted(() => {
	const loadBettingMarkets = vi.fn();
	const applyBettingMarketAction = vi.fn();

	return {
		mockAdminStore: {
			loading: false,
			bettingMarketsLoading: false,
			bettingMarkets: [] as AdminBettingMarket[],
			successMessage: null as string | null,
			errorMessage: null as string | null,
			loadBettingMarkets,
			applyBettingMarketAction
		},
		mockAuth: {
			user: null as { activeClubUuid?: string } | null,
			bettingAccess: { key: 'betting', state: 'enabled', source: 'subscription' }
		}
	};
});

vi.mock('$lib/stores/admin.svelte', () => ({ adminStore: mockAdminStore }));
vi.mock('$lib/stores/auth.svelte', () => ({ auth: mockAuth }));

const mockMarket: AdminBettingMarket = {
	id: 42,
	round_id: 'round-1',
	round_title: 'Spring Round 1',
	market_type: 'round_winner',
	title: 'Round Winner',
	status: 'settled',
	locks_at: '2025-06-01T09:55:00Z',
	settled_at: '2025-06-01T11:00:00Z',
	result_summary: 'Player One won with score 54',
	settlement_version: 1,
	ticket_count: 8,
	exposure: 300,
	accepted_tickets: 8,
	won_tickets: 3,
	lost_tickets: 5,
	voided_tickets: 0
};

describe('BettingMarketManager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAdminStore.loading = false;
		mockAdminStore.bettingMarketsLoading = false;
		mockAdminStore.bettingMarkets = [];
		mockAdminStore.successMessage = null;
		mockAdminStore.errorMessage = null;
		mockAdminStore.loadBettingMarkets.mockResolvedValue(undefined);
		mockAdminStore.applyBettingMarketAction.mockResolvedValue(true);
		mockAuth.user = { activeClubUuid: 'club-123' };
		mockAuth.bettingAccess = { key: 'betting', state: 'enabled', source: 'subscription' };
	});

	it('shows empty state when no markets exist', () => {
		const { getByText } = render(BettingMarketManager);
		expect(getByText(/no persisted betting markets yet/i)).toBeTruthy();
	});

	it('shows loading text while markets are loading', () => {
		mockAdminStore.bettingMarketsLoading = true;
		const { getByText } = render(BettingMarketManager);
		expect(getByText(/loading betting markets/i)).toBeTruthy();
	});

	it('renders market cards with title and status badge', () => {
		mockAdminStore.bettingMarkets = [mockMarket];
		const { getByText } = render(BettingMarketManager);

		expect(getByText('Round Winner')).toBeTruthy();
		expect(getByText('settled')).toBeTruthy();
		expect(getByText('Spring Round 1 • round winner')).toBeTruthy();
	});

	it('renders market stats (tickets, exposure, won, lost)', () => {
		mockAdminStore.bettingMarkets = [mockMarket];
		const { getAllByText, getByText } = render(BettingMarketManager);

		// ticket_count and accepted_tickets both equal 8, so multiple matches expected
		expect(getAllByText('8').length).toBeGreaterThanOrEqual(1);
		expect(getByText('300')).toBeTruthy();
		expect(getByText('3')).toBeTruthy(); // won_tickets
		expect(getByText('5')).toBeTruthy(); // lost_tickets
	});

	it('shows validation error when void is clicked without a reason', async () => {
		mockAdminStore.bettingMarkets = [mockMarket];
		const { getByRole, getByText } = render(BettingMarketManager);

		const voidButton = getByRole('button', { name: /void market/i });
		await fireEvent.click(voidButton);

		await waitFor(() => {
			expect(getByText(/reason is required/i)).toBeTruthy();
		});
		expect(mockAdminStore.applyBettingMarketAction).not.toHaveBeenCalled();
	});

	it('calls applyBettingMarketAction with void when reason is provided', async () => {
		mockAdminStore.bettingMarkets = [mockMarket];
		const { getByPlaceholderText, getByRole } = render(BettingMarketManager);

		await fireEvent.input(getByPlaceholderText(/required reason/i), {
			target: { value: 'Player disqualified' }
		});
		await fireEvent.click(getByRole('button', { name: /void market/i }));

		await waitFor(() => {
			expect(mockAdminStore.applyBettingMarketAction).toHaveBeenCalledWith(
				'club-123',
				42,
				'void',
				'Player disqualified'
			);
		});
	});

	it('calls applyBettingMarketAction with resettle when reason is provided', async () => {
		mockAdminStore.bettingMarkets = [mockMarket];
		const { getByPlaceholderText, getByRole } = render(BettingMarketManager);

		await fireEvent.input(getByPlaceholderText(/required reason/i), {
			target: { value: 'Score correction applied' }
		});
		await fireEvent.click(getByRole('button', { name: /resettle/i }));

		await waitFor(() => {
			expect(mockAdminStore.applyBettingMarketAction).toHaveBeenCalledWith(
				'club-123',
				42,
				'resettle',
				'Score correction applied'
			);
		});
	});

	it('displays success message from adminStore', () => {
		mockAdminStore.successMessage = 'Market voided successfully.';
		const { getByText } = render(BettingMarketManager);
		expect(getByText('Market voided successfully.')).toBeTruthy();
	});

	it('displays error message from adminStore', () => {
		mockAdminStore.errorMessage = 'Failed to void market.';
		const { getByText } = render(BettingMarketManager);
		expect(getByText('Failed to void market.')).toBeTruthy();
	});

	it('void button is disabled when market is already voided', () => {
		mockAdminStore.bettingMarkets = [{ ...mockMarket, status: 'voided' }];
		const { getByRole } = render(BettingMarketManager);

		const voidButton = getByRole('button', { name: /void market/i }) as HTMLButtonElement;
		expect(voidButton.disabled).toBe(true);
	});

	it('resettle button is disabled when market is open (not settled/voided)', () => {
		mockAdminStore.bettingMarkets = [{ ...mockMarket, status: 'open' }];
		const { getByRole } = render(BettingMarketManager);

		const resettleButton = getByRole('button', { name: /resettle/i }) as HTMLButtonElement;
		expect(resettleButton.disabled).toBe(true);
	});
});
