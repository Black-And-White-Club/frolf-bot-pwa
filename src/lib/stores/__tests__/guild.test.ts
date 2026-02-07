// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config dependency to avoid environment issues
vi.mock('$lib/config', () => ({
	config: {
		api: {
			url: 'https://api.test'
		}
	}
}));

// Mock auth dependency
vi.mock('../auth.svelte', () => ({
	auth: {
		user: null as { activeClubUuid?: string; guildId?: string } | null
	}
}));

describe('GuildService (guild.svelte.ts)', () => {
	let guildService: any;
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

		const mod = await import('../guild.svelte');
		guildService = mod.guildService;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('initial state', () => {
		it('starts with null info and not loading', () => {
			expect(guildService.info).toBeNull();
			expect(guildService.loading).toBe(false);
		});

		it('id is null when user not authenticated', () => {
			mockAuth.user = null;
			expect(guildService.id).toBeNull();
		});

		it('id prefers activeClubUuid over guildId', () => {
			mockAuth.user = { activeClubUuid: 'club-123', guildId: 'guild-456' };
			expect(guildService.id).toBe('club-123');
		});

		it('id falls back to guildId when no activeClubUuid', () => {
			mockAuth.user = { guildId: 'guild-456' };
			expect(guildService.id).toBe('guild-456');
		});
	});

	describe('loadGuildInfo', () => {
		it('does nothing when no id available', async () => {
			mockAuth.user = null;

			await guildService.loadGuildInfo();

			expect(guildService.info).toBeNull();
			expect(guildService.loading).toBe(false);
		});

		it('returns cached guild info if available', async () => {
			const cachedGuild = { id: 'club-123', name: 'Cached Club', icon: 'icon.png' };
			localStorage.setItem('guild:club-123', JSON.stringify(cachedGuild));
			mockAuth.user = { activeClubUuid: 'club-123' };
			
			// Mock successful API fetch for background refresh
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ name: 'Fresh Club', icon_url: 'fresh.png' })
			});

			await guildService.loadGuildInfo();

			expect(guildService.info).toEqual(cachedGuild);
			expect(guildService.loading).toBe(false);
			
			// Wait for background refresh promise
			await new Promise(process.nextTick);
			
			expect(fetchMock).toHaveBeenCalledWith(`https://api.test/clubs/club-123`);
		});

		it('loads info from API when no cache', async () => {
			mockAuth.user = { activeClubUuid: 'club-new' };
			
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ name: 'API Club', icon_url: 'api.png' })
			});

			await guildService.loadGuildInfo();

			expect(fetchMock).toHaveBeenCalledWith(`https://api.test/clubs/club-new`);
			expect(guildService.info).toEqual({
				id: 'club-new',
				name: 'API Club',
				icon: 'api.png'
			});
			expect(guildService.loading).toBe(false);
		});

		it('falls back to legacy endpoint if club endpoint fails', async () => {
			mockAuth.user = { activeClubUuid: 'club-legacy' };
			
			// First call fails (clubs)
			fetchMock.mockResolvedValueOnce({ ok: false });
			// Second call succeeds (guilds)
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ name: 'Legacy Guild', icon_url: 'legacy.png' })
			});

			await guildService.loadGuildInfo();

			expect(fetchMock).toHaveBeenNthCalledWith(1, `https://api.test/clubs/club-legacy`);
			expect(fetchMock).toHaveBeenNthCalledWith(2, `https://api.test/guilds/club-legacy`);
			
			expect(guildService.info).toEqual({
				id: 'club-legacy',
				name: 'Legacy Guild',
				icon: 'legacy.png'
			});
		});

		it('falls back to placeholder on API failure', async () => {
			mockAuth.user = { activeClubUuid: 'club-fail' };
			
			// Both fail
			fetchMock.mockResolvedValue({ ok: false });

			await guildService.loadGuildInfo();

			expect(guildService.info).toEqual({
				id: 'club-fail',
				name: 'Disc Golf League',
				icon: undefined
			});
		});

		it('caches loaded guild info', async () => {
			mockAuth.user = { activeClubUuid: 'club-cache-test' };
			
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ name: 'Cached Club', icon_url: 'icon.png' })
			});

			await guildService.loadGuildInfo();

			const cached = localStorage.getItem('guild:club-cache-test');
			expect(cached).not.toBeNull();
			expect(JSON.parse(cached!)).toEqual({
				id: 'club-cache-test',
				name: 'Cached Club',
				icon: 'icon.png'
			});
		});

		it('handles invalid cached JSON gracefully', async () => {
			localStorage.setItem('guild:club-bad', 'not-valid-json');
			mockAuth.user = { activeClubUuid: 'club-bad' };
			
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ name: 'Fresh Club', icon_url: 'fresh.png' })
			});

			await guildService.loadGuildInfo();

			// Should load fresh data instead of throwing
			expect(guildService.info).toEqual({
				id: 'club-bad',
				name: 'Fresh Club',
				icon: 'fresh.png'
			});
		});
	});

	describe('clear', () => {
		it('clears guild info', async () => {
			mockAuth.user = { activeClubUuid: 'club-123' };
			await guildService.loadGuildInfo();
			expect(guildService.info).not.toBeNull();

			guildService.clear();

			expect(guildService.info).toBeNull();
		});
	});
});
