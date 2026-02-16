// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies for switchClub
vi.mock('../subscriptions.svelte', () => ({
	subscriptionManager: { start: vi.fn() }
}));

vi.mock('../dataLoader.svelte', () => ({
	dataLoader: { clearData: vi.fn(), loadInitialData: vi.fn() }
}));

vi.mock('../club.svelte', () => ({
	clubService: { loadClubInfo: vi.fn() }
}));

describe('AuthService HTTP methods (auth.svelte.ts)', () => {
	let auth: any;
	let fetchMock: ReturnType<typeof vi.fn>;
	let originalLocation: Location;

	beforeEach(async () => {
		vi.resetModules();
		localStorage.clear();
		sessionStorage.clear();

		// Save original location
		originalLocation = window.location;

		// Mock fetch with proper promise handling
		fetchMock = vi.fn().mockImplementation(() => Promise.resolve({ ok: false, status: 404 }));
		global.fetch = fetchMock;

		const mod = await import('../auth.svelte');
		auth = mod.auth;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		// Restore location
		if (originalLocation) {
			Object.defineProperty(window, 'location', {
				value: originalLocation,
				writable: true
			});
		}
	});

	describe('extractTokenFromUrl', () => {
		it('returns null when no token in URL', () => {
			// Mock location with no token
			Object.defineProperty(window, 'location', {
				value: {
					search: '',
					pathname: '/page',
					hash: ''
				},
				writable: true
			});

			const result = auth.extractTokenFromUrl();

			expect(result).toBeNull();
		});

		it('extracts token from URL and removes it', () => {
			const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

			Object.defineProperty(window, 'location', {
				value: {
					search: '?t=my-secret-token&other=param',
					pathname: '/page',
					hash: ''
				},
				writable: true
			});

			const result = auth.extractTokenFromUrl();

			expect(result).toBe('my-secret-token');
			expect(replaceStateSpy).toHaveBeenCalled();
			// Should preserve other params but remove token
			const [, , url] = replaceStateSpy.mock.calls[0];
			expect(url).not.toContain('t=my-secret-token');
			expect(url).toContain('other=param');
		});

		it('handles URL with only token param', () => {
			const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

			Object.defineProperty(window, 'location', {
				value: {
					search: '?t=token-only',
					pathname: '/page',
					hash: ''
				},
				writable: true
			});

			auth.extractTokenFromUrl();

			const [, , url] = replaceStateSpy.mock.calls[0];
			expect(url).toBe('/page');
		});

		it('preserves hash in URL', () => {
			const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

			Object.defineProperty(window, 'location', {
				value: {
					search: '?t=token',
					pathname: '/page',
					hash: '#section'
				},
				writable: true
			});

			auth.extractTokenFromUrl();

			const [, , url] = replaceStateSpy.mock.calls[0];
			expect(url).toBe('/page#section');
		});

		it('prefers hash token and removes it from fragment params', () => {
			const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

			Object.defineProperty(window, 'location', {
				value: {
					search: '?other=param',
					pathname: '/page',
					hash: '#t=hash-token&view=stats'
				},
				writable: true
			});

			const result = auth.extractTokenFromUrl();

			expect(result).toBe('hash-token');
			const [, , url] = replaceStateSpy.mock.calls[0];
			expect(url).toBe('/page?other=param#view=stats');
		});
	});

	describe('validateToken', () => {
		it('returns null for malformed tokens', () => {
			expect(auth.validateToken('invalid')).toBeNull();
			expect(auth.validateToken('only.two')).toBeNull();
			expect(auth.validateToken('')).toBeNull();
		});

		it('returns null for expired tokens', () => {
			const expiredPayload = {
				sub: 'user:123',
				exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
			};
			const token = createMockToken(expiredPayload);

			expect(auth.validateToken(token)).toBeNull();
		});

		it('returns claims for valid tokens', () => {
			const futureExp = Math.floor(Date.now() / 1000) + 3600;
			const payload = {
				sub: 'user:456',
				user_uuid: 'uuid-456',
				exp: futureExp
			};
			const token = createMockToken(payload);

			const claims = auth.validateToken(token);

			expect(claims).not.toBeNull();
			expect(claims.sub).toBe('user:456');
			expect(claims.user_uuid).toBe('uuid-456');
		});

		it('handles base64url encoding', () => {
			// Token with characters that differ between base64 and base64url
			const payload = {
				sub: 'user:test',
				exp: Math.floor(Date.now() / 1000) + 3600
			};
			const token = createMockToken(payload);

			const claims = auth.validateToken(token);
			expect(claims).not.toBeNull();
		});
	});

	describe('refreshSession', () => {
		it('returns null on 401 and resets auth state', async () => {
			// First authenticate
			auth.status = 'authenticated';
			auth.token = 'old-token';

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 401
			});

			const result = await auth.refreshSession();

			expect(result).toBeNull();
			// signOut is called which resets state
			expect(auth.token).toBeNull();
			expect(auth.status).toBe('idle');
		});

		it('returns null on 403', async () => {
			auth.status = 'authenticated';

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 403
			});

			const result = await auth.refreshSession();

			expect(result).toBeNull();
		});

		it('sets error on other failures', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500
			});

			const result = await auth.refreshSession();

			expect(result).toBeNull();
			expect(auth.error).toBe('Session refresh failed');
		});

		it('parses ticket and sets user on success', async () => {
			const ticketPayload = {
				sub: 'user:789',
				user_uuid: 'uuid-789',
				active_club_uuid: 'club-abc',
				guild: 'guild-xyz',
				role: 'admin',
				clubs: [{ club_uuid: 'club-abc', role: 'admin' }]
			};
			const ticket = createMockToken(ticketPayload);

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ticket })
			});

			const result = await auth.refreshSession();

			expect(result).toBe(ticket);
			expect(auth.token).toBe(ticket);
			expect(auth.status).toBe('authenticated');
			expect(auth.user).toEqual({
				id: '789',
				uuid: 'uuid-789',
				activeClubUuid: 'club-abc',
				guildId: 'guild-xyz',
				role: 'admin',
				clubs: [{ club_uuid: 'club-abc', role: 'admin' }]
			});
		});

		it('handles missing role in claims', async () => {
			const ticketPayload = {
				sub: 'user:test',
				user_uuid: 'u1',
				active_club_uuid: 'c1',
				clubs: []
				// no role field
			};
			const ticket = createMockToken(ticketPayload);

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ticket })
			});

			await auth.refreshSession();

			expect(auth.user?.role).toBe('viewer'); // default
		});
	});

	describe('loginWithToken', () => {
		it('calls callback endpoint then refreshes session', async () => {
			const callbackTicket = createMockToken({
				sub: 'user:login',
				user_uuid: 'u1',
				active_club_uuid: 'c1',
				clubs: []
			});

			fetchMock
				.mockResolvedValueOnce({
					// callback endpoint
					ok: true,
					json: () => Promise.resolve({})
				})
				.mockResolvedValueOnce({
					// ticket endpoint (refreshSession)
					ok: true,
					json: () => Promise.resolve({ ticket: callbackTicket })
				});

			await auth.loginWithToken('magic-link-token');

			expect(fetchMock).toHaveBeenCalledWith('/api/auth/callback', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ token: 'magic-link-token' })
			});
			expect(auth.status).toBe('authenticated');
		});

		it('sets error status on callback failure', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 400
			});

			await auth.loginWithToken('bad-token');

			expect(auth.status).toBe('error');
			expect(auth.error).toBe('Login failed');
		});
	});

	describe('signOut', () => {
		it('clears all auth state', async () => {
			// Setup authenticated state
			const ticket = createMockToken({
				sub: 'user:test',
				user_uuid: 'u1',
				active_club_uuid: 'c1',
				clubs: []
			});
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ticket })
			});
			await auth.refreshSession();
			expect(auth.isAuthenticated).toBe(true);

			// Mock logout endpoint (fire and forget, so we just need it to return a promise)
			fetchMock.mockResolvedValueOnce({ ok: true });

			auth.signOut();

			expect(auth.token).toBeNull();
			expect(auth.user).toBeNull();
			expect(auth.status).toBe('idle');
			expect(auth.error).toBeNull();
			expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
		});

		it('clears sessionStorage', () => {
			sessionStorage.setItem('auth_token', 'old-token');

			auth.signOut();

			expect(sessionStorage.getItem('auth_token')).toBeNull();
		});
	});

	describe('displayName getter', () => {
		it('returns Guest when not authenticated', () => {
			expect(auth.displayName).toBe('Guest');
		});

		it('returns club display_name when available', async () => {
			const ticket = createMockToken({
				sub: 'user:123',
				user_uuid: 'u1',
				active_club_uuid: 'club-a',
				clubs: [{ club_uuid: 'club-a', role: 'player', display_name: 'ProGolfer123' }]
			});
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ticket })
			});
			await auth.refreshSession();

			expect(auth.displayName).toBe('ProGolfer123');
		});

		it('falls back to user id when no display_name', async () => {
			const ticket = createMockToken({
				sub: 'user:456',
				user_uuid: 'u1',
				active_club_uuid: 'club-x',
				clubs: [{ club_uuid: 'club-x', role: 'viewer' }] // no display_name
			});
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ ticket })
			});
			await auth.refreshSession();

			expect(auth.displayName).toBe('456');
		});
	});
});

// Helper to create valid JWT tokens
function createMockToken(payload: any = {}) {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const defaultPayload = {
		exp: Math.floor(Date.now() / 1000) + 3600,
		...payload
	};
	const p = btoa(JSON.stringify(defaultPayload))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
	return `${header}.${p}.signature`;
}
