// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BettingWalletAdjuster from '../BettingWalletAdjuster.svelte';

const { mockAdminStore, mockAuth, mockTagStore, mockUserProfiles } = vi.hoisted(() => {
	const adjustBettingWallet = vi.fn();

	return {
		mockAdminStore: {
			loading: false,
			successMessage: null as string | null,
			errorMessage: null as string | null,
			adjustBettingWallet
		},
		mockAuth: {
			user: null as { activeClubUuid?: string } | null,
			bettingAccess: { key: 'betting', state: 'enabled', source: 'subscription' }
		},
		mockTagStore: {
			tagList: [] as Array<{ memberId: string; currentTag: number | null }>,
			loading: false
		},
		mockUserProfiles: {
			getDisplayName: vi.fn((memberId: string) => memberId),
			getAvatarUrl: vi.fn(() => '')
		}
	};
});

vi.mock('$lib/stores/admin.svelte', () => ({ adminStore: mockAdminStore }));
vi.mock('$lib/stores/auth.svelte', () => ({ auth: mockAuth }));
vi.mock('$lib/stores/tags.svelte', () => ({ tagStore: mockTagStore }));
vi.mock('$lib/stores/userProfiles.svelte', () => ({ userProfiles: mockUserProfiles }));

describe('BettingWalletAdjuster', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAdminStore.loading = false;
		mockAdminStore.successMessage = null;
		mockAdminStore.errorMessage = null;
		mockAdminStore.adjustBettingWallet.mockResolvedValue(undefined);
		mockAuth.user = { activeClubUuid: 'club-123' };
		mockAuth.bettingAccess = { key: 'betting', state: 'enabled', source: 'subscription' };
		mockTagStore.loading = false;
		mockTagStore.tagList = [
			{ memberId: 'member-1', currentTag: 1 },
			{ memberId: 'member-2', currentTag: 2 }
		];
		mockUserProfiles.getDisplayName.mockImplementation((id: string) =>
			id === 'member-1' ? 'Player One' : id === 'member-2' ? 'Player Two' : id
		);
	});

	it('renders the player select and required fields', () => {
		const { getByLabelText } = render(BettingWalletAdjuster);

		expect(getByLabelText(/player/i)).toBeTruthy();
		expect(getByLabelText(/wallet delta/i)).toBeTruthy();
		expect(getByLabelText(/reason/i)).toBeTruthy();
	});

	it('submit button is disabled when form is incomplete', () => {
		const { getByRole } = render(BettingWalletAdjuster);
		const submitButton = getByRole('button', {
			name: /adjust betting wallet/i
		}) as HTMLButtonElement;
		expect(submitButton.disabled).toBe(true);
	});

	it('submit button is disabled when amount is zero', async () => {
		const { getByLabelText, getByRole } = render(BettingWalletAdjuster);

		await fireEvent.change(getByLabelText(/player/i), { target: { value: 'member-1' } });
		await fireEvent.input(getByLabelText(/wallet delta/i), { target: { value: '0' } });
		await fireEvent.input(getByLabelText(/reason/i), { target: { value: 'Test' } });

		const submitButton = getByRole('button', {
			name: /adjust betting wallet/i
		}) as HTMLButtonElement;
		expect(submitButton.disabled).toBe(true);
	});

	it('calls adjustBettingWallet with correct args on valid submit', async () => {
		const { getByLabelText, getByRole } = render(BettingWalletAdjuster);

		await fireEvent.change(getByLabelText(/player/i), { target: { value: 'member-1' } });
		await fireEvent.input(getByLabelText(/wallet delta/i), { target: { value: '50' } });
		await fireEvent.input(getByLabelText(/reason/i), { target: { value: 'Admin bonus' } });

		const submitButton = getByRole('button', {
			name: /adjust betting wallet/i
		}) as HTMLButtonElement;
		expect(submitButton.disabled).toBe(false);

		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockAdminStore.adjustBettingWallet).toHaveBeenCalledWith(
				'club-123',
				'member-1',
				50,
				'Admin bonus'
			);
		});
	});

	it('calls adjustBettingWallet with negative amount', async () => {
		const { getByLabelText, getByRole } = render(BettingWalletAdjuster);

		await fireEvent.change(getByLabelText(/player/i), { target: { value: 'member-2' } });
		await fireEvent.input(getByLabelText(/wallet delta/i), { target: { value: '-25' } });
		await fireEvent.input(getByLabelText(/reason/i), { target: { value: 'Correction' } });

		await fireEvent.click(getByRole('button', { name: /adjust betting wallet/i }));

		await waitFor(() => {
			expect(mockAdminStore.adjustBettingWallet).toHaveBeenCalledWith(
				'club-123',
				'member-2',
				-25,
				'Correction'
			);
		});
	});

	it('shows frozen-state informational copy when betting is frozen', () => {
		mockAuth.bettingAccess = { key: 'betting', state: 'frozen', source: 'manual_deny' };
		const { getByText } = render(BettingWalletAdjuster);

		expect(getByText(/Betting is frozen for members/i)).toBeTruthy();
	});

	it('shows enabled-state copy when betting is enabled', () => {
		const { getByText } = render(BettingWalletAdjuster);

		expect(getByText(/seasonal betting wallet only/i)).toBeTruthy();
	});

	it('disables submit when no active club UUID', async () => {
		mockAuth.user = null;
		const { getByLabelText, getByRole } = render(BettingWalletAdjuster);

		await fireEvent.change(getByLabelText(/player/i), { target: { value: 'member-1' } });
		await fireEvent.input(getByLabelText(/wallet delta/i), { target: { value: '10' } });
		await fireEvent.input(getByLabelText(/reason/i), { target: { value: 'Test' } });

		const submitButton = getByRole('button', {
			name: /adjust betting wallet/i
		}) as HTMLButtonElement;
		expect(submitButton.disabled).toBe(true);
	});

	it('displays success message from adminStore', () => {
		mockAdminStore.successMessage = 'Wallet adjusted successfully.';
		const { getByText } = render(BettingWalletAdjuster);
		expect(getByText('Wallet adjusted successfully.')).toBeTruthy();
	});

	it('displays error message from adminStore', () => {
		mockAdminStore.errorMessage = 'Failed to adjust wallet.';
		const { getByText } = render(BettingWalletAdjuster);
		expect(getByText('Failed to adjust wallet.')).toBeTruthy();
	});
});
