import { test, expect } from 'vitest';
import { createLeaderboardPreviewStore, type LeaderboardState } from '../leaderboardPreviewStore';
import type { SnapshotEnvelope, PatchEnvelope } from '../../types/snapshots';

test('handleEnvelope replace_snapshot replaces snapshot', () => {
	const transport = {
		connect: async () => {},
		disconnect: async () => {},
		onMessage: () => {}
	} as unknown as Parameters<typeof createLeaderboardPreviewStore>[0];
	const store = createLeaderboardPreviewStore(transport);

	// seed snapshot
	const s: SnapshotEnvelope = {
		type: 'snapshot',
		schema: 'leaderboard.v1',
		version: 1,
		ts: new Date().toISOString(),
		payload: {
			id: 's1',
			version: 1,
			lastUpdated: new Date().toISOString(),
			topTags: [],
			topPlayers: []
		}
	};
	store.handleEnvelope(s);

	// replace snapshot via patch op
	const p: PatchEnvelope = {
		type: 'patch',
		schema: 'leaderboard.v1',
		version: 2,
		op: 'replace_snapshot',
		ts: new Date().toISOString(),
		payload: {
			id: 's2',
			version: 2,
			lastUpdated: new Date().toISOString(),
			topTags: [],
			topPlayers: []
		}
	};
	store.handleEnvelope(p);

	let seen: LeaderboardState | null = null;
	const unsub = store.subscribe((s) => (seen = s));
	unsub();
	expect(seen).not.toBeNull();
	expect(seen!.lastVersion).toBe(2);
	expect(seen!.snapshot?.id).toBe('s2');
});
