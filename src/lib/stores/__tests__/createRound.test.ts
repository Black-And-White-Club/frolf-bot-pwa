// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPublish = vi.fn();

const mockAuth = {
	isAuthenticated: false,
	activeRole: 'viewer' as 'viewer' | 'player' | 'editor' | 'admin',
	user: null as { guildId?: string; id?: string } | null
};

vi.mock('../auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('../nats.svelte', () => ({
	nats: {
		publish: mockPublish
	}
}));

describe('createRoundService', () => {
	beforeEach(async () => {
		vi.resetModules();
		mockPublish.mockReset();
		mockAuth.isAuthenticated = false;
		mockAuth.activeRole = 'viewer';
		mockAuth.user = null;
	});

	it('rejects submit when user is not authenticated', async () => {
		const mod = await import('../createRound.svelte');
		const result = await mod.createRoundService.submit({
			title: 'Weekly Round',
			description: '',
			startTime: '2026-02-24 18:30',
			timezone: 'America/Chicago',
			location: 'Pier Park'
		});

		expect(result).toBe(false);
		expect(mockPublish).not.toHaveBeenCalled();
		expect(mod.createRoundService.errorMessage).toContain('Sign in');
	});

	it('rejects submit when user is viewer', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'viewer';
		mockAuth.user = { guildId: 'guild-123', id: 'user-123' };

		const mod = await import('../createRound.svelte');
		const result = await mod.createRoundService.submit({
			title: 'Weekly Round',
			description: '',
			startTime: '2026-02-24 18:30',
			timezone: 'America/Chicago',
			location: 'Pier Park'
		});

		expect(result).toBe(false);
		expect(mockPublish).not.toHaveBeenCalled();
		expect(mod.createRoundService.errorMessage).toContain('Player role');
	});

	it('publishes round.creation.requested.v1 payload for player role', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = { guildId: 'guild-123', id: 'user-123' };

		const mod = await import('../createRound.svelte');
		const result = await mod.createRoundService.submit({
			title: 'Weekly Round',
			description: 'tags match',
			startTime: '2026-02-24 18:30',
			timezone: 'America/Chicago',
			location: 'Pier Park'
		});

		expect(result).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith(
			'round.creation.requested.v1',
			{
				guild_id: 'guild-123',
				title: 'Weekly Round',
				description: 'tags match',
				start_time: '2026-02-24 18:30',
				location: 'Pier Park',
				user_id: 'user-123',
				channel_id: '',
				timezone: 'America/Chicago'
			},
			{
				correlation_id: expect.any(String),
				submitted_at: expect.any(String),
				user_timezone: 'America/Chicago',
				raw_start_time: '2026-02-24 18:30',
				source: 'pwa'
			}
		);
		expect(mod.createRoundService.successMessage).toContain('requested');
	});

	it('uses fallback timezone when timezone is blank', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'editor';
		mockAuth.user = { guildId: 'guild-123', id: 'user-123' };

		const mod = await import('../createRound.svelte');
		await mod.createRoundService.submit({
			title: 'Weekly Round',
			description: '',
			startTime: '2026-02-24 18:30',
			timezone: ' ',
			location: 'Pier Park'
		});

		expect(mockPublish).toHaveBeenCalledWith(
			'round.creation.requested.v1',
			expect.objectContaining({
				timezone: 'America/Chicago'
			}),
			expect.objectContaining({
				correlation_id: expect.any(String),
				submitted_at: expect.any(String),
				user_timezone: 'America/Chicago',
				raw_start_time: '2026-02-24 18:30',
				source: 'pwa'
			})
		);
	});
});
