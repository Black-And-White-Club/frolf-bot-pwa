// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminBackfillRoundUploader from '../AdminBackfillRoundUploader.svelte';

const { mockAdminStore, mockAuth } = vi.hoisted(() => {
	return {
		mockAdminStore: {
			loading: false,
			successMessage: null as string | null,
			errorMessage: null as string | null,
			backfillRound: vi.fn(),
			backfillCheck: vi.fn()
		},
		mockAuth: {
			user: null as { activeClubUuid?: string; guildId?: string; id?: string } | null
		}
	};
});

vi.mock('$lib/stores/admin.svelte', () => ({
	adminStore: mockAdminStore
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	auth: mockAuth
}));

describe('AdminBackfillRoundUploader', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAdminStore.loading = false;
		mockAdminStore.successMessage = null;
		mockAdminStore.errorMessage = null;
		mockAdminStore.backfillRound.mockResolvedValue(undefined);
		mockAdminStore.backfillCheck.mockResolvedValue(null);
		mockAuth.user = {
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			id: 'admin-123'
		};
	});

	it('submit button has correct brand classes for light-mode visibility', () => {
		const { getByRole } = render(AdminBackfillRoundUploader);
		const btn = getByRole('button', { name: /submit backfill round/i });
		expect(btn.className).toContain('bg-liquid-skobeloff');
		expect(btn.className).toContain('text-white');
	});

	it('submit button is disabled by default', () => {
		const { getByRole } = render(AdminBackfillRoundUploader);
		const btn = getByRole('button', { name: /submit backfill round/i }) as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});
});
