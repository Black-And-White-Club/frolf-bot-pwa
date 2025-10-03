// NOTE
// The full backend authentication implementation lives in the frolf-bot
// backend service. The PWA doesn't interact with the DB directly —
// keep minimal stubs here to satisfy imports during development and
// to avoid pulling backend-only packages into the client bundle.

export const sessionCookieName = 'auth-session';

export function generateSessionToken(): string {
  throw new Error('generateSessionToken is not available in the PWA; use the backend API');
}

export async function createSession(_token: string, _userId: string) {
  void _token;
  void _userId;
  throw new Error('createSession is not available in the PWA; use the backend API');
}

export async function validateSessionToken(_token: string) {
  void _token;
  return { session: null, user: null } as const;
}

export type SessionValidationResult = { session: null; user: null };

export async function invalidateSession(_sessionId: string) {
  void _sessionId;
  throw new Error('invalidateSession is not available in the PWA; use the backend API');
}

export function setSessionTokenCookie() {
  // No-op in the PWA. Auth cookies are set by the backend.
}

export function deleteSessionTokenCookie() {
  // No-op in the PWA.
}
