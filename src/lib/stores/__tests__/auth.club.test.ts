// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../auth.svelte';

describe('AuthService Club Logic', () => {
	let authService: AuthService;

	beforeEach(() => {
		authService = new AuthService();
	});

	it('resolves displayName from active club membership', () => {
		authService.user = {
			id: 'discord-123',
			uuid: 'user-uuid-1',
			activeClubUuid: 'club-A',
			guildId: 'guild-A',
			role: 'player',
			clubs: [
				{
					club_uuid: 'club-A',
					role: 'player',
					display_name: 'Ace Thrower',
					avatar_url: 'http://avatar.com/ace.png'
				},
				{
					club_uuid: 'club-B',
					role: 'viewer',
					display_name: 'Just Watching'
				}
			]
		};

		expect(authService.displayName).toBe('Ace Thrower');
	});

	it('fallbacks to Discord ID if no club membership found', () => {
		authService.user = {
			id: 'discord-123',
			uuid: 'user-uuid-1',
			activeClubUuid: 'club-C', // User is not in this club list
			guildId: 'guild-C',
			role: 'player',
			clubs: [
				{
					club_uuid: 'club-A',
					role: 'player',
					display_name: 'Ace Thrower'
				}
			]
		};

		expect(authService.displayName).toBe('discord-123');
	});

	it('fallbacks to Discord ID if club membership has no display name', () => {
		authService.user = {
			id: 'discord-123',
			uuid: 'user-uuid-1',
			activeClubUuid: 'club-A',
			guildId: 'guild-A',
			role: 'player',
			clubs: [
				{
					club_uuid: 'club-A',
					role: 'player'
					// display_name is undefined
				}
			]
		};

		expect(authService.displayName).toBe('discord-123');
	});

	it('returns Guest if no user', () => {
		authService.user = null;
		expect(authService.displayName).toBe('Guest');
	});
});
