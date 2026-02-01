import type { Transport } from './leaderboardPreviewStore';
import type { Envelope, SnapshotEnvelope } from '../types/snapshots';

export class MockTransport implements Transport {
	private cb?: (env: Envelope) => void;
	private connected = false;

	async connect(): Promise<void> {
		this.connected = true;
	}
	async disconnect(): Promise<void> {
		this.connected = false;
	}
	onMessage(cb: (env: Envelope) => void): void {
		this.cb = cb;
	}

	async send(env: Envelope) {
		// mimic async arrival
		setTimeout(() => this.cb?.(env), 0);
	}

	async requestSnapshot(_id: string): Promise<SnapshotEnvelope | null> {
		// default mock returns null; tests can override by calling send
		void _id;
		return null;
	}
}
