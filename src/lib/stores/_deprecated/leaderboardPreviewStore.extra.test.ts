import { describe, it, expect, vi } from 'vitest';
import { createLeaderboardPreviewStore, type LeaderboardState } from '../leaderboardPreviewStore';
import type { SnapshotEnvelope, PatchEnvelope } from '../../types/snapshots';

describe('createLeaderboardPreviewStore extra branches', () => {
	it('applies a snapshot envelope when valid', () => {
		const transport = {
			connect: vi.fn(() => Promise.resolve()),
			disconnect: vi.fn(() => Promise.resolve()),
			onMessage: vi.fn()
		} as unknown as Parameters<typeof createLeaderboardPreviewStore>[0];

		const store = createLeaderboardPreviewStore(transport);
		const snap: SnapshotEnvelope = {
			type: 'snapshot',
			schema: 'leaderboard.v1',
			version: 5,
			ts: new Date().toISOString(),
			payload: {
				id: 's1',
				version: 5,
				lastUpdated: new Date().toISOString(),
				topTags: [],
				topPlayers: []
			}
		};

		// call handleEnvelope directly
		store.handleEnvelope(snap);

		let seen: LeaderboardState | null = null;
		const unsub = store.subscribe((s) => (seen = s));
		unsub();
		expect(seen).not.toBeNull();
		expect(seen!.lastVersion).toBe(5);
		expect(seen!.snapshot?.id).toBe('s1');
	});

	it('ignores old patches and applies upsert_player when snapshot exists', () => {
		const transport2 = {
			connect: vi.fn(() => Promise.resolve()),
			disconnect: vi.fn(() => Promise.resolve()),
			onMessage: vi.fn()
		} as unknown as Parameters<typeof createLeaderboardPreviewStore>[0];

		const store = createLeaderboardPreviewStore(transport2);
		// seed snapshot
		const seed: SnapshotEnvelope = {
			type: 'snapshot',
			schema: 'leaderboard.v1',
			version: 1,
			ts: new Date().toISOString(),
			payload: {
				id: 's2',
				version: 1,
				lastUpdated: new Date().toISOString(),
				topTags: [],
				topPlayers: []
			}
		};
		store.handleEnvelope(seed);

		// old patch - version <= lastVersion should be ignored
		const oldPatch: PatchEnvelope = {
			type: 'patch',
			schema: 'leaderboard.v1',
			version: 1,
			op: 'upsert_player',
			ts: new Date().toISOString(),
			payload: { userId: 'u1', name: 'x', score: 10 }
		};
		store.handleEnvelope(oldPatch);

		let seen: LeaderboardState | null = null;
		const unsub1 = store.subscribe((s) => (seen = s));
		unsub1();
		expect(seen).not.toBeNull();
		expect(seen!.lastVersion).toBe(1);
		expect(seen!.snapshot?.topPlayers.length).toBe(0);

		// new patch - should add player when name and score present
		const newPatch: PatchEnvelope = {
			type: 'patch',
			schema: 'leaderboard.v1',
			version: 2,
			op: 'upsert_player',
			ts: new Date().toISOString(),
			payload: { userId: 'u1', name: 'x', score: 10 }
		};
		store.handleEnvelope(newPatch);
		const unsub2 = store.subscribe((s) => (seen = s));
		unsub2();
		expect(seen).not.toBeNull();
		expect(seen!.lastVersion).toBe(2);
		expect(seen!.snapshot?.topPlayers.length).toBe(1);
	});
});
