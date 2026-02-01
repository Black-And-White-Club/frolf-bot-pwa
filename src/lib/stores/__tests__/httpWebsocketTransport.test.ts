import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpWebSocketTransport } from '../httpWebsocketTransport';
import type { SnapshotEnvelope, Envelope } from '../../types/snapshots';

class MockWebSocket {
	onopen: (() => void) | null = null;
	onmessage: ((ev: { data: string }) => void) | null = null;
	onerror: (() => void) | null = null;
	onclose: (() => void) | null = null;
	constructor(public url: string) {
		setTimeout(() => {
			if (this.onopen) this.onopen();
		}, 0);
	}

	send(..._args: unknown[]) {
		// reference args to avoid unused var lint warning in tests
		void _args;
	}
	close() {
		if (this.onclose) this.onclose();
	}
}

describe('HttpWebSocketTransport', () => {
	let originalDesc: PropertyDescriptor | undefined;
	beforeEach(() => {
		originalDesc = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket');
		Object.defineProperty(globalThis, 'WebSocket', { value: MockWebSocket, configurable: true });
	});
	afterEach(() => {
		if (originalDesc) Object.defineProperty(globalThis, 'WebSocket', originalDesc);
		else
			try {
				Object.defineProperty(globalThis, 'WebSocket', { value: undefined, configurable: true });
			} catch {
				/* ignore */
			}
		vi.restoreAllMocks();
	});

	it('fetches snapshot and receives ws messages', async () => {
		const fakeSnap: SnapshotEnvelope = {
			type: 'snapshot',
			schema: 'leaderboard.v1',
			version: 1,
			ts: new Date().toISOString(),
			payload: {
				id: 'leaderboard:default',
				version: 1,
				lastUpdated: new Date().toISOString(),
				topTags: [],
				topPlayers: []
			}
		};

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => fakeSnap }));

		const transport = new HttpWebSocketTransport({
			snapshotUrl: 'http://localhost',
			wsUrl: 'ws://localhost'
		});
		let received: Envelope | null = null;
		transport.onMessage((env) => {
			received = env;
		});

		await transport.connect();
		const snap = await transport.requestSnapshot('leaderboard:default');
		expect(snap).toBeTruthy();

		// simulate server message
		// use the transport's test-only accessor (single cast)
		const ws = (transport as { internalWs?: MockWebSocket }).internalWs;
		if (ws && ws.onmessage) {
			ws.onmessage({
				data: JSON.stringify({
					type: 'patch',
					schema: 'leaderboard.patch.v1',
					version: 2,
					op: 'upsert_player',
					payload: { userId: 'u1' }
				})
			});
		}
		await new Promise((r) => setTimeout(r, 0));
		expect(received).toBeTruthy();

		await transport.disconnect();
	});
});
