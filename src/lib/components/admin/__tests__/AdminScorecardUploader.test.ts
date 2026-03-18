// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminScorecardUploader from '../AdminScorecardUploader.svelte';

const { mockAdminStore, mockAuth, mockRoundService } = vi.hoisted(() => {
	return {
		mockAdminStore: {
			loading: false,
			successMessage: null as string | null,
			errorMessage: null as string | null,
			uploadScorecard: vi.fn()
		},
		mockAuth: {
			user: null as { activeClubUuid?: string; guildId?: string; id?: string } | null
		},
		mockRoundService: {
			recentCompletedRounds: [] as Array<{ id: string; title: string; startTime: string }>,
			rounds: [] as Array<{ id: string; eventMessageId?: string }>
		}
	};
});

vi.mock('$lib/stores/admin.svelte', () => ({
	adminStore: mockAdminStore
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('$lib/stores/round.svelte', () => ({
	roundService: mockRoundService
}));

describe('AdminScorecardUploader', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAdminStore.loading = false;
		mockAdminStore.successMessage = null;
		mockAdminStore.errorMessage = null;
		mockAdminStore.uploadScorecard.mockResolvedValue(undefined);
		mockAuth.user = {
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			id: 'admin-123'
		};
		mockRoundService.recentCompletedRounds = [];
		mockRoundService.rounds = [];
	});

	it('submit button has correct brand classes for light-mode visibility', () => {
		const { getByRole } = render(AdminScorecardUploader);
		const btn = getByRole('button', { name: /upload scorecard/i });
		expect(btn.className).toContain('bg-liquid-skobeloff');
		expect(btn.className).toContain('text-white');
	});

	it('submit button is disabled by default', () => {
		const { getByRole } = render(AdminScorecardUploader);
		const btn = getByRole('button', { name: /upload scorecard/i }) as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});
});
