// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

const { mockAuth, mockTagStore } = vi.hoisted(() => ({
	mockAuth: {
		user: null as { activeClubUuid?: string; guildId?: string } | null
	},
	mockTagStore: {
		tagList: [] as Array<unknown>,
		fetchTagList: vi.fn()
	}
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('$lib/stores/tags.svelte', () => ({
	tagStore: mockTagStore
}));

vi.mock('$lib/stores/nats.svelte', () => ({
	nats: { isConnected: true }
}));

vi.mock('$lib/components/admin/TagEditor.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/admin/PointAdjuster.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/admin/AdminScorecardUploader.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/admin/AdminBackfillRoundUploader.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/admin/BettingMarketManager.svelte', () => ({ default: () => {} }));
vi.mock('$lib/components/admin/BettingWalletAdjuster.svelte', () => ({ default: () => {} }));

describe('src/routes/admin/+page.svelte', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAuth.user = null;
		mockTagStore.tagList = [];
	});

	it('retries tag list loading for club-only identities', async () => {
		mockAuth.user = {
			activeClubUuid: 'club-123',
			guildId: ''
		};

		render(Page);

		await waitFor(() => {
			// guildId normalizes to null for club-only users; clubUuid is passed as second arg
			expect(mockTagStore.fetchTagList).toHaveBeenCalledWith(null, 'club-123');
		});
	});
});
