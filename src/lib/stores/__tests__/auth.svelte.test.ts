// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock dependencies before importing the store
vi.mock('$lib/stores/subscriptions.svelte', () => ({
	subscriptionManager: {
		start: vi.fn()
	}
}));

vi.mock('$lib/stores/dataLoader.svelte', () => ({
	dataLoader: {
		clearData: vi.fn(),
		loadInitialData: vi.fn()
	}
}));

vi.mock('$lib/stores/club.svelte', () => ({
	clubService: {
		loadClubInfo: vi.fn()
	}
}));

describe('AuthService (auth.svelte.ts)', () => {
	let auth: any;

	beforeEach(async () => {
		vi.resetModules();
		// Clear storage
		sessionStorage.clear();
		// Reset URL
		window.history.replaceState({}, '', '/');
		
		const mod = await import('../auth.svelte');
		auth = mod.auth;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('initializes with idle status', () => {
		expect(auth.status).toBe('idle');
		expect(auth.isAuthenticated).toBe(false);
	});

	describe('initialize', () => {
		it('reads token from sessionStorage if present', () => {
			const validToken = createMockToken({ sub: 'user:123', exp: Date.now() / 1000 + 3600 });
			sessionStorage.setItem('auth_token', validToken);

			auth.initialize();

			expect(auth.status).toBe('authenticated');
			expect(auth.token).toBe(validToken);
			expect(auth.user?.id).toBe('123');
		});

		it('extracts token from URL if not in storage', () => {
			const validToken = createMockToken({ sub: 'user:456', exp: Date.now() / 1000 + 3600 });
			
			// Mock window.location.search
			const originalLocation = window.location;
			delete (window as any).location;
			(window as any).location = {
				...originalLocation,
				search: `?t=${validToken}`,
				pathname: '/',
				hash: ''
			};
			
			// Mock history.replaceState
			const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

			auth.initialize();

			expect(auth.status).toBe('authenticated');
			expect(auth.token).toBe(validToken);
			expect(sessionStorage.getItem('auth_token')).toBe(validToken);
			
			// Should clean URL
			expect(replaceStateSpy).toHaveBeenCalled();
			const [state, title, url] = replaceStateSpy.mock.calls[0];
			expect(url).toBe('/');
			
			// Restore location
			(window as any).location = originalLocation;
		});

		it('handles invalid token in storage', () => {
			sessionStorage.setItem('auth_token', 'invalid.token.parts');

			auth.initialize();

			expect(auth.status).toBe('error');
			expect(auth.error).toContain('Invalid');
			expect(sessionStorage.getItem('auth_token')).toBeNull();
		});

		it('handles expired token', () => {
			const expiredToken = createMockToken({ sub: 'user:123', exp: Date.now() / 1000 - 3600 });
			sessionStorage.setItem('auth_token', expiredToken);

			auth.initialize();

			expect(auth.status).toBe('error');
			expect(auth.isAuthenticated).toBe(false);
		});
	});

	describe('displayName', () => {
		it('returns "Guest" when not authenticated', () => {
			expect(auth.displayName).toBe('Guest');
		});

		it('returns active club display name if available', () => {
			const user = {
				id: '123',
				activeClubUuid: 'club-a',
				clubs: [
					{ club_uuid: 'club-a', display_name: 'Pro Golfer', role: 'player' }
				]
			};
			// We can manually set the state for testing since it's a class instance
			// but better to simulate a login or mock the state if possible.
			// Since we can't easily write to readonly state or private fields without setters,
			// we'll simulate a login flow.
			const token = createMockToken({
				sub: 'user:123',
				user_uuid: 'u1',
				active_club_uuid: 'club-a',
				clubs: user.clubs
			});
			sessionStorage.setItem('auth_token', token);
			auth.initialize();

			expect(auth.displayName).toBe('Pro Golfer');
		});

		it('fallbacks to user id if membership not found', () => {
			const token = createMockToken({
				sub: 'user:123',
				user_uuid: 'u1',
				active_club_uuid: 'club-b', // Not in clubs list
				clubs: []
			});
			sessionStorage.setItem('auth_token', token);
			auth.initialize();

			expect(auth.displayName).toBe('123');
		});
	});

	describe('switchClub', () => {
		it('updates active club and reloads data', async () => {
			const clubs = [
				{ club_uuid: 'club-1', role: 'viewer' },
				{ club_uuid: 'club-2', role: 'admin' }
			];
			const token = createMockToken({
				sub: 'user:123',
				active_club_uuid: 'club-1',
				clubs
			});
			sessionStorage.setItem('auth_token', token);
			auth.initialize();

			expect(auth.user.activeClubUuid).toBe('club-1');
			expect(auth.canAdmin).toBe(false);

			await auth.switchClub('club-2');

			expect(auth.user.activeClubUuid).toBe('club-2');
			expect(auth.canAdmin).toBe(true);

			// Verify side effects
			const { subscriptionManager } = await import('../subscriptions.svelte');
			const { dataLoader } = await import('../dataLoader.svelte');
			const { clubService } = await import('../club.svelte');

			expect(subscriptionManager.start).toHaveBeenCalledWith('club-2');
			expect(dataLoader.clearData).toHaveBeenCalled();
			expect(clubService.loadClubInfo).toHaveBeenCalled();
			expect(dataLoader.loadInitialData).toHaveBeenCalled();
		});

		it('does nothing if user not member of target club', async () => {
			const token = createMockToken({
				sub: 'user:123',
				active_club_uuid: 'club-1',
				clubs: [{ club_uuid: 'club-1', role: 'viewer' }]
			});
			sessionStorage.setItem('auth_token', token);
			auth.initialize();

			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			
			await auth.switchClub('club-99');

			expect(auth.user.activeClubUuid).toBe('club-1');
			expect(consoleSpy).toHaveBeenCalled();
		});
	});

	describe('signOut', () => {
		it('clears state and storage', () => {
			const token = createMockToken({ sub: 'user:123' });
			sessionStorage.setItem('auth_token', token);
			auth.initialize();

			expect(auth.isAuthenticated).toBe(true);

			auth.signOut();

			expect(auth.isAuthenticated).toBe(false);
			expect(auth.token).toBeNull();
			expect(auth.user).toBeNull();
			expect(sessionStorage.getItem('auth_token')).toBeNull();
		});
	});
});

// Helper to create valid JWT tokens
function createMockToken(payload: any = {}) {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const defaultPayload = {
		sub: 'user:default',
		exp: Math.floor(Date.now() / 1000) + 3600,
		...payload
	};
	// Use base64url encoding for payload as expected by auth service
	const p = btoa(JSON.stringify(defaultPayload))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
		
	return `${header}.${p}.signature`;
}
