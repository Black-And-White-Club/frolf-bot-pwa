// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock auth dependency
vi.mock('../auth.svelte', () => ({
	auth: {
		user: null as { activeClubUuid?: string; guildId?: string } | null
	}
}));

describe('GuildService (guild.svelte.ts)', () => {
	let guildService: any;
	let mockAuth: any;

	beforeEach(async () => {
		vi.resetModules();
		localStorage.clear();

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

			await guildService.loadGuildInfo();

			expect(guildService.info).toEqual(cachedGuild);
			expect(guildService.loading).toBe(false);
		});

		it('loads placeholder info when no cache', async () => {
			mockAuth.user = { activeClubUuid: 'club-new' };

			await guildService.loadGuildInfo();

			expect(guildService.info).toEqual({
				id: 'club-new',
				name: 'Disc Golf League',
				icon: undefined
			});
			expect(guildService.loading).toBe(false);
		});

		it('caches loaded guild info', async () => {
			mockAuth.user = { activeClubUuid: 'club-cache-test' };

			await guildService.loadGuildInfo();

			const cached = localStorage.getItem('guild:club-cache-test');
			expect(cached).not.toBeNull();
			expect(JSON.parse(cached!)).toEqual({
				id: 'club-cache-test',
				name: 'Disc Golf League',
				icon: undefined
			});
		});

		it('handles invalid cached JSON gracefully', async () => {
			localStorage.setItem('guild:club-bad', 'not-valid-json');
			mockAuth.user = { activeClubUuid: 'club-bad' };

			await guildService.loadGuildInfo();

			// Should load fresh data instead of throwing
			expect(guildService.info).toEqual({
				id: 'club-bad',
				name: 'Disc Golf League',
				icon: undefined
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
