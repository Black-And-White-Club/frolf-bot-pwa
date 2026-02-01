import type { Transport } from './leaderboardPreviewStore';
import type { Envelope, SnapshotEnvelope } from '../types/snapshots';

export class HttpWebSocketTransport implements Transport {
	private ws?: {
		onopen?: () => void;
		onmessage?: (ev: { data: unknown }) => void;
		onerror?: () => void;
		onclose?: () => void;
		close?: () => void;
	};
	private cb?: (env: Envelope) => void;

	// Test-only accessor: allows tests to inspect the live WebSocket without relying on casts
	get internalWs() {
		return this.ws;
	}

	constructor(private opts: { snapshotUrl: string; wsUrl: string; token?: string }) {}

	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				// global WebSocket may be provided by environment (browser or test harness)
				const GlobalWebSocket = getGlobalWebSocketConstructor();
				if (!GlobalWebSocket) throw new Error('no WebSocket available');
				const wsInstance = new GlobalWebSocket(this.opts.wsUrl);
				this.ws = wsInstance;
				wsInstance.onopen = () => resolve();
				wsInstance.onmessage = (ev: { data: unknown }) => {
					try {
						const raw = typeof ev.data === 'string' ? ev.data : String(ev.data);
						const data = JSON.parse(raw);
						// runtime-check envelope-ish shape minimally
						if (data && typeof data.type === 'string') this.cb?.(data as Envelope);
					} catch {
						// ignore malformed payloads
					}
				};
				wsInstance.onerror = () => {
					// noop for now
				};
				wsInstance.onclose = () => {
					// noop
				};
			} catch {
				return reject(new Error('failed to construct WebSocket'));
			}
		});
	}

	async disconnect(): Promise<void> {
		try {
			if (this.ws && this.ws.close) this.ws.close();
		} finally {
			this.ws = undefined;
		}
	}

	onMessage(cb: (env: Envelope) => void): void {
		this.cb = cb;
	}

	async requestSnapshot(id: string): Promise<SnapshotEnvelope | null> {
		const base = this.opts.snapshotUrl.replace(/\/$/, '');
		const url = `${base}/${encodeURIComponent(id)}`;
		const headers: Record<string, string> = { Accept: 'application/json' };
		if (this.opts.token) headers['Authorization'] = `Bearer ${this.opts.token}`;

		const res = await fetch(url, { headers });
		if (!res.ok) return null;
		const body = (await res.json()) as SnapshotEnvelope;
		return body;
	}
}

export default HttpWebSocketTransport;

type WSConstructor = new (url: string) => {
	onopen?: () => void;
	onmessage?: (ev: { data: unknown }) => void;
	onerror?: () => void;
	onclose?: () => void;
	close?: () => void;
};

function getGlobalWebSocketConstructor(): WSConstructor | undefined {
	// avoid double-casts; use a single narrowed typing for the global
	const g = globalThis as { WebSocket?: unknown };
	const maybe = g.WebSocket;
	if (typeof maybe === 'function') return maybe as WSConstructor;
	return undefined;
}
