import type { Session, User } from '$lib/stores/auth';
import type { Round } from '$lib/types/backend';

export function makeUser(overrides?: Partial<User>): User {
  return { id: 'u1', name: 'Sam', avatar_url: null, ...overrides } as User;
}

export function makeSession(overrides?: Partial<Session>): Session {
  return { user: makeUser(), token: 'token-1', ...overrides } as Session;
}

export function makeRound(overrides?: Partial<Round>): Round {
  const now = new Date().toISOString();
  return {
    round_id: 'r1',
    title: 'Test Round',
    created_at: now,
    status: 'scheduled',
    location: 'Park',
    description: '',
    start_time: now,
    ...overrides,
  } as Round;
}
