// src/lib/stores/auth.svelte.ts

interface ClubRole {
	club_uuid: string;
	role: 'viewer' | 'player' | 'editor' | 'admin';
	display_name?: string;
	avatar_url?: string;
}

interface AuthUser {
	id: string; // Discord ID (legacy)
	uuid: string; // Internal User UUID
	activeClubUuid: string; // Internal Club UUID
	guildId: string; // Discord Guild ID (legacy)
	role: 'viewer' | 'player' | 'editor' | 'admin';
	clubs: ClubRole[];
}

interface TokenClaims {
	sub: string; // Discord ID
	user_uuid: string;
	active_club_uuid: string;
	clubs: ClubRole[];
	guild: string; // Legacy Guild ID
	role: string; // Legacy Role
	exp: number; // expiry timestamp
	iat: number; // issued at
}

export class AuthService {
	// Reactive state
	token = $state<string | null>(null);
	user = $state<AuthUser | null>(null);
	status = $state<'idle' | 'validating' | 'authenticated' | 'error'>('idle');
	error = $state<string | null>(null);

	// Derived state
	isAuthenticated = $derived(this.status === 'authenticated');
	canEdit = $derived(this.user?.role === 'editor' || this.user?.role === 'admin');
	canAdmin = $derived(this.user?.role === 'admin');

	/**
	 * Extract token from URL query parameter ?t=
	 * Removes the token from URL for security
	 */
	extractTokenFromUrl(): string | null {
		if (typeof window === 'undefined') return null;

		// URLSearchParams mutability is okay here; keep simple extraction
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(window.location.search);
		const token = params.get('t');

		if (token) {
			// Remove token from URL using history.replaceState for security
			params.delete('t');
			const newSearch = params.toString();
			const newUrl =
				window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
			window.history.replaceState({}, '', newUrl);
		}

		return token;
	}

	/**
	 * Validate JWT token and return claims if valid
	 * Checks expiry and parses payload
	 */
	validateToken(token: string): TokenClaims | null {
		try {
			// JWT format: header.payload.signature
			const parts = token.split('.');
			if (parts.length !== 3) return null;

			// Decode payload (middle segment)
			const payload = parts[1];
			const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
			const claims = JSON.parse(decoded) as TokenClaims;

			// Check expiry
			const now = Math.floor(Date.now() / 1000);
			if (claims.exp <= now) {
				return null;
			}

			return claims;
		} catch {
			return null;
		}
	}

	/**
	 * Get the display name for the current active club
	 */
	get displayName(): string {
		if (!this.user) return 'Guest';
		const membership = this.user.clubs.find((c) => c.club_uuid === this.user?.activeClubUuid);
		return membership?.display_name ?? this.user.id;
	}

	/**
	 * Initialize auth state
	 * 1. Checks URL for magic link token
	 * 2. Tries silent refresh using HttpOnly cookie
	 */
	async initialize(): Promise<void> {
		if (typeof window === 'undefined') return;

		this.status = 'validating';

		// 1. Check if we just landed from a magic link
		const urlToken = this.extractTokenFromUrl();
		if (urlToken) {
			await this.loginWithToken(urlToken);
			return;
		}

		// 2. Try silent refresh (works if we have a valid cookie)
		await this.refreshSession();


		// 3. Restore preferred club if possible
		// TS incorrectly narrows status to 'validating' here despite async calls
		if ((this.status as string) === 'authenticated' && this.user) {
			const preferredClub = localStorage.getItem('frolf_preferred_club');
			if (preferredClub && preferredClub !== this.user.activeClubUuid) {
				const hasMembership = this.user.clubs.some((c) => c.club_uuid === preferredClub);
				if (hasMembership) {
					await this.switchClub(preferredClub);
				}
			}
		}

		if ((this.status as string) !== 'authenticated') {
			this.status = 'idle';
		}
	}

	/**
	 * Login using a one-time token (from magic link)
	 * Sets the HttpOnly cookie via the backend
	 */
	async loginWithToken(token: string): Promise<void> {
		this.status = 'validating';
		try {
			const res = await fetch(`/api/auth/callback?t=${token}`);
			if (!res.ok) throw new Error('Login failed');

			const data = await res.json();
			// We are authenticated (cookie is set), now get a ticket to get user info
			await this.refreshSession();
		} catch (e) {
			this.status = 'error';
			this.error = e instanceof Error ? e.message : 'Unknown error';
		}
	}

	/**
	 * Refresh the session by getting a new NATS ticket
	 * Also populates user info from the ticket claims
	 */
	async refreshSession(): Promise<string | null> {
		try {
			const res = await fetch('/api/auth/ticket');
			if (!res.ok) {
				if (res.status === 401 || res.status === 403) {
					if (this.status === 'authenticated') {
						this.signOut();
					}
				} else {
					this.error = 'Session refresh failed';
				}
				return null;
			}

			const { ticket } = await res.json();
			const claims = this.parseJWT(ticket);

			this.token = ticket;
			this.user = {
				id: claims.sub?.replace('user:', '') || '',
				uuid: claims.user_uuid,
				activeClubUuid: claims.active_club_uuid,
				guildId: claims.guild || '',
				role: (claims.role || 'viewer') as AuthUser['role'],
				clubs: claims.clubs || []
			};

			this.status = 'authenticated';
			return ticket;
		} catch (e) {
			console.error('Failed to refresh session:', e);
			return null;
		}
	}

	/**
	 * Parse JWT without external dependencies
	 */
	private parseJWT(token: string): any {
		try {
			const base64Url = token.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			const jsonPayload = decodeURIComponent(
				atob(base64)
					.split('')
					.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			);
			return JSON.parse(jsonPayload);
		} catch (e) {
			return {};
		}
	}

	/**
	 * Switch the active club for the current session
	 * Updates the store and triggers data reload via subscription manager
	 */
	async switchClub(clubUuid: string): Promise<void> {
		if (!this.user) return;

		// Verify membership
		const membership = this.user.clubs.find((c) => c.club_uuid === clubUuid);
		if (!membership) {
			console.warn(`User is not a member of club ${clubUuid}`);
			return;
		}

		// Update local state
		this.user.activeClubUuid = clubUuid;
		this.user.role = membership.role; // Update active role context
		localStorage.setItem('frolf_preferred_club', clubUuid);

		// Reload app data — dynamic imports avoid circular dependency (init imports auth)
		const { subscriptionManager } = await import('./subscriptions.svelte');
		const { dataLoader } = await import('./dataLoader.svelte');
		const { clubService } = await import('./club.svelte');

		subscriptionManager.start(clubUuid);
		// clear old club specific data
		dataLoader.clearData();
		await clubService.loadClubInfo(); // Will use new ID from auth.user.activeClubUuid
		await dataLoader.loadInitialData();
	}

	/**
	 * Sign out and clear all auth state
	 */
	signOut(): void {
		// Fire and forget logout
		fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

		this.token = null;
		this.user = null;
		this.status = 'idle';
		this.error = null;

		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('auth_token');
		}
	}
}

export const auth = new AuthService();
