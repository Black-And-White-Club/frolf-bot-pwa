// Minimal fixtures used by tests. Keep these lightweight and only provide fields tests rely on.
import type { Round, User, Session } from '$lib/types/backend';

export function makeRound(overrides: Partial<Round> = {}): Round {
	const now = new Date().toISOString();
	return {
		round_id: 'r-1',
		guild_id: 'g-1',
		title: 'Test Round',
		status: 'scheduled',
		participants: [],
		created_by: 'u1',
		created_at: now,
		updated_at: now,
		...overrides
	} as unknown as Round;
}

export function makeSession(overrides: Partial<Session> = {}) {
	return {
		user: { id: 'u1', name: 'Test User', ...((overrides as any).user ?? {}) },
		token: 't1',
		...overrides
	} as unknown as Session;
}
