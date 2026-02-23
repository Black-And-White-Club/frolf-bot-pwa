// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPublish = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('../nats.svelte', () => ({
	nats: {
		publish: mockPublish,
		subscribe: mockSubscribe,
		unsubscribe: mockUnsubscribe
	}
}));

vi.mock('../dataLoader.svelte', () => ({
	dataLoader: {
		reload: vi.fn()
	}
}));

describe('adminStore.uploadScorecard', () => {
	function createMockFile(name: string, bytes: number[]): File {
		const data = new Uint8Array(bytes);
		return {
			name,
			size: data.byteLength,
			arrayBuffer: async () => data.buffer
		} as unknown as File;
	}

	beforeEach(() => {
		vi.resetModules();
		vi.useFakeTimers();
		vi.clearAllMocks();
		vi.stubGlobal('crypto', {
			randomUUID: () => 'test-import-id'
		});
		if (typeof globalThis.btoa !== 'function') {
			globalThis.btoa = (input: string) => Buffer.from(input, 'binary').toString('base64');
		}
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('publishes admin scorecard upload with required overwrite + guest + source fields', async () => {
		const { adminStore } = await import('../admin.svelte');
		const file = createMockFile('scores.csv', [97, 98, 99]);

		await adminStore.uploadScorecard({
			guildId: 'guild-123',
			userId: 'admin-123',
			roundId: 'round-123',
			eventMessageId: 'msg-123',
			file,
			notes: '  uploaded from test  '
		});

		expect(adminStore.errorMessage).toBeNull();
		expect(mockPublish).toHaveBeenCalledTimes(1);
		expect(mockPublish).toHaveBeenCalledWith(
			'round.scorecard.admin.upload.requested.v1',
			expect.objectContaining({
				guild_id: 'guild-123',
				user_id: 'admin-123',
				round_id: 'round-123',
				message_id: 'msg-123',
				file_name: 'scores.csv',
				source: 'admin_pwa_upload',
				allow_guest_players: true,
				overwrite_existing_scores: true,
				notes: 'uploaded from test',
				file_data: 'YWJj'
			})
		);
		expect(adminStore.successMessage).toContain('Scorecard upload queued');
	});

	it('rejects unsupported file types and does not publish', async () => {
		const { adminStore } = await import('../admin.svelte');
		const file = createMockFile('scores.txt', [1, 2, 3]);

		await adminStore.uploadScorecard({
			guildId: 'guild-123',
			userId: 'admin-123',
			roundId: 'round-123',
			file
		});

		expect(mockPublish).not.toHaveBeenCalled();
		expect(adminStore.errorMessage).toBe('Only .csv and .xlsx files are supported');
	});
});
