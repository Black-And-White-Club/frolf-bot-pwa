import { describe, it, expect } from 'vitest';
import { createLeaderboardPreviewStore } from '../leaderboardPreviewStore';
import { MockTransport } from '../mockTransport';
import type { Envelope, LeaderboardSnapshot } from '../../types/snapshots';

describe('LeaderboardPreviewStore', () => {
	it('applies snapshot and ignores older patches', async () => {
		const transport = new MockTransport();
		const store = createLeaderboardPreviewStore(transport);

		// start but mockTransport.requestSnapshot returns null
		await store.start();

		// send snapshot v1
		const snap: import('../../types/snapshots').Envelope = {
			type: 'snapshot',
			schema: 'leaderboard.v1',
			version: 1,
			ts: new Date().toISOString(),
			payload: {
				id: 'leaderboard:default',
				version: 1,
				lastUpdated: new Date().toISOString(),
				topTags: [{ tag: 'park', count: 5 }],
				topPlayers: [{ userId: 'u1', name: 'Sam', score: 10 }]
			}
		};

		await transport.send(snap);

		await new Promise((r) => setTimeout(r, 10));

		let state: { snapshot: LeaderboardSnapshot | null; lastVersion: number } | undefined;
		store.subscribe((s) => (state = s))();
		expect(state).toBeDefined();
		expect(state!.snapshot).toBeTruthy();
		expect(state!.lastVersion).toBe(1);

		// send an older patch (v1) - should be ignored
		const oldPatch: Envelope = {
			type: 'patch',
			schema: 'leaderboard.patch.v1',
			version: 1,
			op: 'upsert_player',
			ts: new Date().toISOString(),
			payload: { userId: 'u2', name: 'Dana', score: 8 }
		};
		await transport.send(oldPatch);
		await new Promise((r) => setTimeout(r, 10));
		expect(state!.snapshot!.topPlayers.length).toBe(1);

		// send v2 patch
		const patch2: Envelope = {
			type: 'patch',
			schema: 'leaderboard.patch.v1',
			version: 2,
			op: 'upsert_player',
			ts: new Date().toISOString(),
			payload: { userId: 'u2', name: 'Dana', score: 8 }
		};
		await transport.send(patch2);
		await new Promise((r) => setTimeout(r, 10));
		expect(state!.lastVersion).toBe(2);
		expect(state!.snapshot!.topPlayers.length).toBe(2);

		await store.stop();
	});
});
