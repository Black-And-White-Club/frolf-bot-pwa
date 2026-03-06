// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPublish = vi.fn();

const mockAuth = {
	isAuthenticated: false,
	canEdit: false,
	activeRole: 'viewer' as 'viewer' | 'player' | 'editor' | 'admin',
	user: null as { activeClubUuid?: string; guildId?: string; id?: string } | null
};

vi.mock('../auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('../nats.svelte', () => ({
	nats: {
		publish: mockPublish
	}
}));

describe('roundActionsService', () => {
	beforeEach(async () => {
		vi.resetModules();
		mockPublish.mockReset();
		mockAuth.isAuthenticated = false;
		mockAuth.canEdit = false;
		mockAuth.activeRole = 'viewer';
		mockAuth.user = null;
	});

	it('publishes participant RSVP updates for players', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = { activeClubUuid: 'club-123', guildId: 'guild-123', id: 'user-123' };

		const mod = await import('../roundActions.svelte');
		const success = await mod.roundActionsService.setParticipantResponse('round-1', 'ACCEPT');

		expect(success).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith(
			'round.participant.join.requested.v2',
			{
				guild_id: 'club-123',
				round_id: 'round-1',
				user_id: 'user-123',
				response: 'ACCEPT'
			},
			expect.objectContaining({
				correlation_id: expect.any(String),
				submitted_at: expect.any(String),
				source: 'pwa'
			})
		);
	});

	it('falls back to guild id when active club uuid is unavailable', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = { guildId: 'guild-fallback', id: 'user-123' };

		const mod = await import('../roundActions.svelte');
		const success = await mod.roundActionsService.submitScore('round-1', -2);

		expect(success).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith(
			'round.score.update.requested.v2',
			expect.objectContaining({
				guild_id: 'guild-fallback'
			}),
			expect.any(Object)
		);
	});

	it('publishes score updates for players', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = { guildId: 'guild-123', id: 'user-123' };

		const mod = await import('../roundActions.svelte');
		const success = await mod.roundActionsService.submitScore('round-1', -2);

		expect(success).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith(
			'round.score.update.requested.v2',
			{
				guild_id: 'guild-123',
				round_id: 'round-1',
				user_id: 'user-123',
				score: -2,
				channel_id: '',
				message_id: ''
			},
			expect.objectContaining({
				correlation_id: expect.any(String),
				submitted_at: expect.any(String),
				source: 'pwa'
			})
		);
	});

	it('requires editor permissions to update rounds', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.canEdit = false;
		mockAuth.user = { guildId: 'guild-123', id: 'user-123' };

		const mod = await import('../roundActions.svelte');
		const success = await mod.roundActionsService.updateRound('round-1', {
			title: 'Updated',
			description: '',
			startTime: '2026-03-05T18:30',
			timezone: 'America/New_York',
			location: 'Pier Park'
		});

		expect(success).toBe(false);
		expect(mod.roundActionsService.errorMessage).toContain('Editor or admin');
		expect(mockPublish).not.toHaveBeenCalled();
	});

	it('publishes round delete for editors', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'editor';
		mockAuth.canEdit = true;
		mockAuth.user = { guildId: 'guild-123', id: 'user-123' };

		const mod = await import('../roundActions.svelte');
		const success = await mod.roundActionsService.deleteRound('round-1');

		expect(success).toBe(true);
		expect(mockPublish).toHaveBeenCalledWith(
			'round.delete.requested.v2',
			{
				guild_id: 'guild-123',
				round_id: 'round-1',
				requesting_user_user_id: 'user-123'
			},
			expect.objectContaining({
				correlation_id: expect.any(String),
				submitted_at: expect.any(String),
				source: 'pwa'
			})
		);
	});
});
