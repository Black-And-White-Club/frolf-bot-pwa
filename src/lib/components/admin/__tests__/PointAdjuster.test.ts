// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PointAdjuster from '../PointAdjuster.svelte';

const { mockAdjustPoints, mockAdminStore, mockAuth, mockTagStore, mockUserProfiles } = vi.hoisted(
	() => {
		const adjustPoints = vi.fn();

		return {
			mockAdjustPoints: adjustPoints,
			mockAdminStore: {
				loading: false,
				successMessage: null as string | null,
				errorMessage: null as string | null,
				adjustPoints
			},
			mockAuth: {
				user: null as { activeClubUuid?: string; guildId?: string; id?: string } | null
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
	}
);

vi.mock('$lib/stores/admin.svelte', () => ({
	adminStore: mockAdminStore
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('$lib/stores/tags.svelte', () => ({
	tagStore: mockTagStore
}));

vi.mock('$lib/stores/userProfiles.svelte', () => ({
	userProfiles: mockUserProfiles
}));

describe('PointAdjuster', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAdjustPoints.mockResolvedValue(undefined);
		mockAdminStore.loading = false;
		mockAdminStore.successMessage = null;
		mockAdminStore.errorMessage = null;
		mockAuth.user = {
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			id: 'admin-123'
		};
		mockTagStore.loading = false;
		mockTagStore.tagList = [{ memberId: 'member-456', currentTag: 7 }];
		mockUserProfiles.getDisplayName.mockImplementation((memberId: string) =>
			memberId === 'member-456' ? 'Member One' : memberId
		);
	});

	it('submits point adjustments for guild identities', async () => {
		const { getByLabelText, getByRole } = render(PointAdjuster);

		await fireEvent.change(getByLabelText(/player/i), {
			target: { value: 'member-456' }
		});
		await fireEvent.input(getByLabelText(/point delta/i), {
			target: { value: '5' }
		});
		await fireEvent.input(getByLabelText(/reason/i), {
			target: { value: 'Bonus points' }
		});

		const submitButton = getByRole('button', { name: 'Adjust Points' }) as HTMLButtonElement;
		expect(submitButton.disabled).toBe(false);

		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockAdjustPoints).toHaveBeenCalledWith(
				'guild-123',
				'admin-123',
				'member-456',
				5,
				'Bonus points'
			);
		});
	});

	it('submit button has correct brand classes for light-mode visibility', () => {
		const { getByRole } = render(PointAdjuster);
		const btn = getByRole('button', { name: /adjust points/i });
		expect(btn.className).toContain('bg-liquid-skobeloff');
		expect(btn.className).toContain('text-white');
	});
});
