// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config dependency to avoid environment issues
vi.mock('$lib/config', () => ({
	config: {
		api: {
			url: 'https://api.test'
		},
		debug: false
	},
	log: vi.fn()
}));

// Mock auth dependency
vi.mock('../auth.svelte', () => ({
	auth: {
		user: null as { activeClubUuid?: string; guildId?: string } | null
	}
}));

// Mock nats dependency
vi.mock('../nats.svelte', () => ({
	nats: {
		request: vi.fn(),
		isConnected: true
	}
}));

describe('ClubService (club.svelte.ts)', () => {
	let clubService: any;
	let mockAuth: any;
	let fetchMock: any;

	beforeEach(async () => {
		vi.resetModules();
		localStorage.clear();

		// Mock fetch
		fetchMock = vi.fn();
		global.fetch = fetchMock;

		// Get mock auth and import module
		const authMod = await import('../auth.svelte');
		mockAuth = authMod.auth;
		mockAuth.user = null;

		const mod = await import('../club.svelte');
		clubService = mod.clubService;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('initial state', () => {
		it('starts with null info and not loading', () => {
			expect(clubService.info).toBeNull();
			expect(clubService.loading).toBe(false);
		});

		it('id is null when user not authenticated', () => {
			mockAuth.user = null;
			expect(clubService.id).toBeNull();
		});

		it('id prefers activeClubUuid over guildId', () => {
			mockAuth.user = { activeClubUuid: 'club-123', guildId: 'guild-456' };
			expect(clubService.id).toBe('club-123');
		});

		it('id falls back to guildId when no activeClubUuid', () => {
			mockAuth.user = { guildId: 'guild-456' };
			expect(clubService.id).toBe('guild-456');
		});
	});

	describe('loadClubInfo', () => {
		it('does nothing when no id available', async () => {
			mockAuth.user = null;

			await clubService.loadClubInfo();

			expect(clubService.info).toBeNull();
			expect(clubService.loading).toBe(false);
		});

		it('returns cached club info if available', async () => {
			const cachedClub = { id: 'club-123', name: 'Cached Club', icon: 'icon.png' };
			localStorage.setItem('club:club-123', JSON.stringify(cachedClub));
			mockAuth.user = { activeClubUuid: 'club-123' };

			// Mock successful NATS response for background refresh
			const { nats } = await import('../nats.svelte');
			vi.mocked(nats.request).mockResolvedValueOnce({
				uuid: 'club-123',
				name: 'Fresh Club',
				icon: 'fresh.png'
			});

			await clubService.loadClubInfo();

			expect(clubService.info).toEqual(cachedClub);
			expect(clubService.loading).toBe(false);

			// Wait for background refresh promise
			await new Promise(process.nextTick);

			expect(nats.request).toHaveBeenCalled();
		});

		it('loads info from NATS when no cache', async () => {
			mockAuth.user = { activeClubUuid: 'club-new' };

			const { nats } = await import('../nats.svelte');
			vi.mocked(nats.request).mockResolvedValueOnce({
				uuid: 'club-new',
				name: 'NATS Club',
				icon: 'nats.png'
			});

			await clubService.loadClubInfo();

			expect(nats.request).toHaveBeenCalledWith(
				'club.info.request.v1.club-new',
				{ club_uuid: 'club-new' },
				expect.any(Object)
			);
			expect(clubService.info).toEqual({
				id: 'club-new',
				name: 'NATS Club',
				icon: 'nats.png'
			});
			expect(clubService.loading).toBe(false);
		});

		it('returns null if NATS fails', async () => {
			mockAuth.user = { activeClubUuid: 'club-fail' };

			const { nats } = await import('../nats.svelte');
			vi.mocked(nats.request).mockRejectedValueOnce(new Error('NATS Error'));

			await clubService.loadClubInfo();

			expect(clubService.info).toBeNull();
		});

		it('caches loaded club info', async () => {
			mockAuth.user = { activeClubUuid: 'club-cache-test' };

			const { nats } = await import('../nats.svelte');
			vi.mocked(nats.request).mockResolvedValueOnce({
				uuid: 'club-cache-test',
				name: 'Cached Club',
				icon: 'icon.png'
			});

			await clubService.loadClubInfo();

			const cached = localStorage.getItem('club:club-cache-test');
			expect(cached).not.toBeNull();
			expect(JSON.parse(cached!)).toEqual({
				id: 'club-cache-test',
				name: 'Cached Club',
				icon: 'icon.png'
			});
		});
	});

	describe('clear', () => {
		it('clears club info', async () => {
			mockAuth.user = { activeClubUuid: 'club-123' };
			// Set some info directly for testing
			(clubService as any).info = { id: 'test', name: 'Test' };
			expect(clubService.info).not.toBeNull();

			clubService.clear();

			expect(clubService.info).toBeNull();
		});
	});
});
