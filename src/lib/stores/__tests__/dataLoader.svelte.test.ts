// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies
const mockNatsRequest = vi.fn();
vi.mock('../nats.svelte', () => ({
	nats: {
		isConnected: true,
		request: mockNatsRequest
	}
}));

const mockRoundService = {
	setLoading: vi.fn(),
	setRoundsFromApi: vi.fn(),
	clear: vi.fn()
};
vi.mock('../round.svelte', () => ({
	roundService: mockRoundService
}));

const mockLeaderboardService = {
	setLoading: vi.fn(),
	setSnapshotFromApi: vi.fn(),
	clear: vi.fn()
};
vi.mock('../leaderboard.svelte', () => ({
	leaderboardService: mockLeaderboardService
}));

const mockUserProfiles = {
	setProfilesFromApi: vi.fn(),
	clear: vi.fn()
};
vi.mock('../userProfiles.svelte', () => ({
	userProfiles: mockUserProfiles
}));

vi.mock('$lib/config', () => ({
	log: vi.fn()
}));

// Mock auth with mutable user
const mockAuth = {
	user: null as { activeClubUuid?: string; guildId?: string } | null
};
vi.mock('../auth.svelte', () => ({
	auth: mockAuth
}));

describe('DataLoader (dataLoader.svelte.ts)', () => {
	let dataLoader: any;
	let mockNats: any;

	beforeEach(async () => {
		vi.resetModules();
		vi.clearAllMocks();

		// Reset mock state
		mockAuth.user = null;
		mockNatsRequest.mockReset();

		// Get fresh module
		const mod = await import('../dataLoader.svelte');
		dataLoader = mod.dataLoader;

		const natsMod = await import('../nats.svelte');
		mockNats = natsMod.nats;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('initial state', () => {
		it('starts with loading false and no error', () => {
			expect(dataLoader.loading).toBe(false);
			expect(dataLoader.error).toBeNull();
		});
	});

	describe('loadInitialData', () => {
		it('does nothing when user not authenticated', async () => {
			mockAuth.user = null;

			await dataLoader.loadInitialData();

			expect(mockNatsRequest).not.toHaveBeenCalled();
			expect(dataLoader.loading).toBe(false);
		});

		it('does nothing when nats not connected', async () => {
			mockAuth.user = { activeClubUuid: 'club-1', guildId: 'guild-1' };
			(mockNats as any).isConnected = false;

			await dataLoader.loadInitialData();

			expect(mockNatsRequest).not.toHaveBeenCalled();
		});

		it('loads rounds and leaderboard on success', async () => {
			mockAuth.user = { activeClubUuid: 'club-123', guildId: 'guild-456' };
			(mockNats as any).isConnected = true;

			mockNatsRequest
				.mockResolvedValueOnce({
					rounds: [{ id: 'round-1' }],
					profiles: { user1: { display_name: 'Player 1' } }
				})
				.mockResolvedValueOnce({
					leaderboard: [{ tag: 1, user_id: 'user1' }],
					profiles: { user2: { display_name: 'Player 2' } }
				});

			await dataLoader.loadInitialData();

			// Verify round request
			expect(mockNatsRequest).toHaveBeenCalledWith(
				'round.list.request.v1.club-123',
				{ guild_id: 'guild-456', club_uuid: 'club-123' },
				{ timeout: 5000 }
			);

			// Verify leaderboard request
			expect(mockNatsRequest).toHaveBeenCalledWith(
				'leaderboard.snapshot.request.v1.club-123',
				{ guild_id: 'guild-456', club_uuid: 'club-123' },
				{ timeout: 5000 }
			);

			// Verify services received data
			expect(mockRoundService.setRoundsFromApi).toHaveBeenCalledWith([{ id: 'round-1' }]);
			expect(mockLeaderboardService.setSnapshotFromApi).toHaveBeenCalledWith(
				[{ tag: 1, user_id: 'user1' }],
				'club-123'
			);
			expect(mockUserProfiles.setProfilesFromApi).toHaveBeenCalledTimes(2);

			expect(dataLoader.loading).toBe(false);
			expect(dataLoader.error).toBeNull();
		});

		it('sets loading states correctly', async () => {
			mockAuth.user = { activeClubUuid: 'club-123', guildId: 'guild-456' };
			(mockNats as any).isConnected = true;

			mockNatsRequest.mockResolvedValue({ rounds: [], leaderboard: [] });

			const loadPromise = dataLoader.loadInitialData();

			// Note: loading state may be checked asynchronously
			await loadPromise;

			expect(mockRoundService.setLoading).toHaveBeenCalledWith(true);
			expect(mockRoundService.setLoading).toHaveBeenCalledWith(false);
			expect(mockLeaderboardService.setLoading).toHaveBeenCalledWith(true);
			expect(mockLeaderboardService.setLoading).toHaveBeenCalledWith(false);
		});

		it('handles request failure gracefully', async () => {
			mockAuth.user = { activeClubUuid: 'club-123', guildId: 'guild-456' };
			(mockNats as any).isConnected = true;

			mockNatsRequest.mockRejectedValue(new Error('Network timeout'));

			await dataLoader.loadInitialData();

			// Should continue despite errors (relying on events)
			expect(dataLoader.loading).toBe(false);
			// Error may or may not be set depending on implementation
		});

		it('falls back to guildId when no activeClubUuid', async () => {
			mockAuth.user = { guildId: 'guild-only' };
			(mockNats as any).isConnected = true;

			mockNatsRequest.mockResolvedValue({ rounds: [], leaderboard: [] });

			await dataLoader.loadInitialData();

			expect(mockNatsRequest).toHaveBeenCalledWith(
				'round.list.request.v1.guild-only',
				expect.any(Object),
				expect.any(Object)
			);
		});

		it('does nothing when no preferredId available', async () => {
			mockAuth.user = {}; // No clubUuid or guildId
			(mockNats as any).isConnected = true;

			await dataLoader.loadInitialData();

			expect(mockNatsRequest).not.toHaveBeenCalled();
		});
	});

	describe('reset', () => {
		it('resets loading and error state', async () => {
			// Manually set state
			dataLoader.loading = true;
			dataLoader.error = 'Some error';

			dataLoader.reset();

			expect(dataLoader.loading).toBe(false);
			expect(dataLoader.error).toBeNull();
		});
	});

	describe('clearData', () => {
		it('resets state and clears all services', () => {
			dataLoader.clearData();

			expect(dataLoader.loading).toBe(false);
			expect(dataLoader.error).toBeNull();
			expect(mockRoundService.clear).toHaveBeenCalled();
			expect(mockLeaderboardService.clear).toHaveBeenCalled();
			expect(mockUserProfiles.clear).toHaveBeenCalled();
		});
	});
});
