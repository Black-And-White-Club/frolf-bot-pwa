import { writable, type Writable } from 'svelte/store';
import type {
	LeaderboardSnapshot,
	Envelope,
	PatchEnvelope,
	SnapshotEnvelope
} from '../types/snapshots';

export interface Transport {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	onMessage(cb: (env: Envelope) => void): void;
	requestSnapshot?(id: string): Promise<SnapshotEnvelope | null>;
}

export interface LeaderboardState {
	snapshot: LeaderboardSnapshot | null;
	lastVersion: number;
}

export function createLeaderboardPreviewStore(transport: Transport) {
	const state: Writable<LeaderboardState> = writable({ snapshot: null, lastVersion: 0 });
	let connected = false;

	function handleSnapshot(s: LeaderboardState, env: Envelope) {
		if (isProbablySnapshot(env.payload)) {
			s.snapshot = env.payload as LeaderboardSnapshot;
		}
		s.lastVersion = env.version;
		return s;
	}

	function applyUpsert(s: LeaderboardState, payload: unknown) {
		const p = payload as { userId: string; name?: string; score?: number };
		const idx = s.snapshot!.topPlayers.findIndex((x) => x.userId === p.userId);
		if (idx !== -1) {
			s.snapshot!.topPlayers[idx] = { ...s.snapshot!.topPlayers[idx], ...p };
		} else if (p.name && typeof p.score === 'number') {
			s.snapshot!.topPlayers.push({ userId: p.userId, name: p.name, score: p.score });
		}
	}

	function handlePatch(s: LeaderboardState, patch: PatchEnvelope) {
		if (patch.version <= s.lastVersion) return s; // ignore old patches
		if (!s.snapshot) return s; // no base snapshot to patch

		if (patch.op === 'upsert_player') {
			applyUpsert(s, patch.payload);
		}

		if (patch.op === 'replace_snapshot' && isProbablySnapshot(patch.payload)) {
			s.snapshot = patch.payload as LeaderboardSnapshot;
		}

		s.lastVersion = patch.version;
		return s;
	}

	function handleEnvelope(env: Envelope) {
		state.update((s) => {
			if (env.type === 'snapshot') return handleSnapshot(s, env);
			const patch = env as PatchEnvelope;
			return handlePatch(s, patch);
		});
	}

	async function start() {
		if (connected) return;
		await transport.connect();
		connected = true;
		transport.onMessage(handleEnvelope);
		// request initial snapshot if supported
		if (transport.requestSnapshot && !getCurrentSnapshotVersion()) {
			const res = await transport.requestSnapshot?.('leaderboard:default');
			if (res) handleEnvelope(res);
		}
	}

	async function stop() {
		if (!connected) return;
		await transport.disconnect();
		connected = false;
	}

	function getCurrentSnapshotVersion(): number | null {
		let v: number | null = null;
		state.subscribe((s) => {
			v = s.lastVersion;
		})();
		return v;
	}

	return {
		subscribe: state.subscribe,
		start,
		stop,
		handleEnvelope // exported for tests
	};
}

function isProbablySnapshot(v: unknown): v is LeaderboardSnapshot {
	if (!v || typeof v !== 'object') return false;
	const r = v as Record<string, unknown>;
	return typeof r.id === 'string' && typeof r.version === 'number' && Array.isArray(r.topPlayers);
}
