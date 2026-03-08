// src/lib/stores/auth.svelte.ts

export interface ClubRole {
	club_uuid: string;
	role: 'viewer' | 'player' | 'editor' | 'admin';
	display_name?: string;
	avatar_url?: string;
}

export interface AuthUser {
	id: string; // Discord ID (legacy)
	uuid: string; // Internal User UUID
	activeClubUuid: string; // Internal Club UUID
	guildId: string; // Discord Guild ID (legacy)
	role: 'viewer' | 'player' | 'editor' | 'admin';
	clubs: ClubRole[];
	linkedProviders: string[]; // OAuth providers linked to this account e.g. ['discord', 'google']
}

export interface TokenClaims {
	sub: string; // Discord ID
	user_uuid: string;
	active_club_uuid: string;
	clubs: ClubRole[];
	linked_providers: string[]; // OAuth providers linked to this account
	guild: string; // Legacy Guild ID
	role: string; // Legacy Role
	exp: number; // expiry timestamp
	iat: number; // issued at
}

export interface AuthInitializeResult {
	authenticated: boolean;
	switchedClubWithDataLoad: boolean;
}

interface SwitchClubOptions {
	reloadData?: boolean;
}

export class AuthService {
	// Reactive state
	token = $state<string | null>(null);
	user = $state<AuthUser | null>(null);
	status = $state<'idle' | 'validating' | 'authenticated' | 'error'>('idle');
	error = $state<string | null>(null);

	// Derived state
	isAuthenticated = $derived(this.status === 'authenticated');
	activeRole = $derived.by(() => {
		if (!this.user) return 'viewer';
		const membership = this.user.clubs.find((c) => c.club_uuid === this.user?.activeClubUuid);
		return membership?.role ?? this.user.role;
	});
	canEdit = $derived(this.activeRole === 'editor' || this.activeRole === 'admin');
	canAdmin = $derived(this.activeRole === 'admin');
	private switchClubPromise: Promise<boolean> | null = null;
	private switchClubTarget: string | null = null;

	/**
	 * Extract token from URL hash/query parameter t
	 * Removes the token from URL for security
	 */
	extractTokenFromUrl(): string | null {
		if (typeof window === 'undefined') return null;

		const { pathname, search, hash } = window.location;
		/* eslint-disable svelte/prefer-svelte-reactivity */
		const queryParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
		/* eslint-enable svelte/prefer-svelte-reactivity */
		const { rawHash, hashParams, hashToken } = this.parseHashToken(hash || '');
		const queryToken = queryParams.get('t');
		const token = hashToken || queryToken;

		if (token) {
			const cleanUrl = this.buildCleanUrl(
				pathname || '/',
				queryParams,
				rawHash,
				hashToken,
				hashParams,
				queryToken
			);
			window.history.replaceState({}, '', cleanUrl);
		}

		return token;
	}

	private parseHashToken(hash: string): {
		rawHash: string;
		hashParams: URLSearchParams | null;
		hashToken: string | null;
	} {
		const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
		/* eslint-disable svelte/prefer-svelte-reactivity */
		const looksLikeParams = rawHash.includes('=') || rawHash.includes('&');
		const hashParams = looksLikeParams ? new URLSearchParams(rawHash) : null;
		/* eslint-enable svelte/prefer-svelte-reactivity */
		return { rawHash, hashParams, hashToken: hashParams?.get('t') ?? null };
	}

	private buildCleanUrl(
		pathname: string,
		queryParams: URLSearchParams,
		rawHash: string,
		hashToken: string | null,
		hashParams: URLSearchParams | null,
		queryToken: string | null
	): string {
		if (hashToken && hashParams) hashParams.delete('t');
		if (queryToken) queryParams.delete('t');
		const newSearch = queryParams.toString();
		const newHash = hashToken && hashParams ? hashParams.toString() : rawHash;
		return `${pathname}${newSearch ? `?${newSearch}` : ''}${newHash ? `#${newHash}` : ''}`;
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
	 * 1. Checks URL (#t=... preferred) for magic link token
	 * 2. Tries silent refresh using HttpOnly cookie
	 */
	async initialize(): Promise<AuthInitializeResult> {
		if (typeof window === 'undefined') {
			return { authenticated: false, switchedClubWithDataLoad: false };
		}

		this.status = 'validating';
		let switchedClubWithDataLoad = false;

		// 1. Check if we just landed from a magic link
		const urlToken = this.extractTokenFromUrl();
		if (urlToken) {
			await this.loginWithToken(urlToken);
			return {
				authenticated: (this.status as string) === 'authenticated',
				switchedClubWithDataLoad: false
			};
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
					switchedClubWithDataLoad = await this.switchClub(preferredClub);
				}
			}
		}

		if ((this.status as string) !== 'authenticated') {
			this.status = 'idle';
		}

		return {
			authenticated: (this.status as string) === 'authenticated',
			switchedClubWithDataLoad
		};
	}

	/**
	 * Login using a one-time token (from magic link)
	 * Sets the HttpOnly cookie via the backend
	 */
	async loginWithToken(token: string): Promise<void> {
		this.status = 'validating';
		try {
			const res = await fetch('/api/auth/callback', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ token })
			});
			if (!res.ok) throw new Error('Login failed');

			await res.json();
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
			const res = await fetch('/api/auth/ticket', { method: 'POST' });
			if (!res.ok) {
				this.handleTicketError(res.status);
				return null;
			}

			const { ticket } = await res.json();
			this.token = ticket;
			this.user = this.userFromClaims(this.parseJWT(ticket));
			this.status = 'authenticated';
			return ticket;
		} catch (e) {
			console.error('Failed to refresh session:', e);
			return null;
		}
	}

	private handleTicketError(status: number): void {
		if (status === 401 || status === 403) {
			if (this.status === 'authenticated') this.signOut();
		} else {
			this.error = 'Session refresh failed';
		}
	}

	private userFromClaims(claims: ReturnType<AuthService['parseJWT']>): AuthUser {
		return {
			id: claims.sub?.replace('user:', '') || '',
			uuid: claims.user_uuid,
			activeClubUuid: claims.active_club_uuid,
			guildId: claims.guild || '',
			role: (claims.role || 'viewer') as AuthUser['role'],
			clubs: claims.clubs || [],
			linkedProviders: claims.linked_providers || []
		};
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
		} catch {
			return {};
		}
	}

	/**
	 * Switch the active club for the current session
	 * Updates the store and triggers data reload via subscription manager
	 */
	async switchClub(clubUuid: string, options: SwitchClubOptions = {}): Promise<boolean> {
		const reloadData = options.reloadData ?? true;
		if (!this.user) return false;

		if (this.switchClubPromise && this.switchClubTarget === clubUuid) {
			return this.switchClubPromise;
		}

		const switchPromise = this.performSwitchClub(clubUuid, reloadData);
		this.switchClubPromise = switchPromise;
		this.switchClubTarget = clubUuid;

		try {
			return await switchPromise;
		} finally {
			if (this.switchClubPromise === switchPromise) {
				this.switchClubPromise = null;
				this.switchClubTarget = null;
			}
		}
	}

	private async performSwitchClub(clubUuid: string, reloadData: boolean): Promise<boolean> {
		if (!this.user) return false;

		const membership = this.user.clubs.find((c) => c.club_uuid === clubUuid);
		if (!membership) {
			console.warn(`User is not a member of club ${clubUuid}`);
			return false;
		}

		try {
			const ticket = await this.fetchTicketForClub(clubUuid);
			if (!ticket) return false;
			this.token = ticket;
			this.user = this.userFromClaims(this.parseJWT(ticket));
		} catch (e) {
			console.error('Failed to switch club on backend:', e);
			this.error = 'Club switch failed';
			return false;
		}

		localStorage.setItem('frolf_preferred_club', clubUuid);

		if (!reloadData) return true;

		await this.reloadAfterClubSwitch(clubUuid);
		return true;
	}

	private async fetchTicketForClub(clubUuid: string): Promise<string | null> {
		const res = await fetch('/api/auth/ticket', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ activeClub: clubUuid })
		});
		if (!res.ok) {
			this.error = `Club switch failed (${res.status})`;
			return null;
		}
		const { ticket } = await res.json();
		if (!ticket || typeof ticket !== 'string') {
			this.error = 'Club switch failed (invalid backend response)';
			return null;
		}
		return ticket;
	}

	private async reloadAfterClubSwitch(clubUuid: string): Promise<void> {
		const { nats } = await import('./nats.svelte');
		await nats.disconnect();
		await nats.connect(this.token as string);

		const { subscriptionManager } = await import('./subscriptions.svelte');
		const { dataLoader } = await import('./dataLoader.svelte');
		const { clubService } = await import('./club.svelte');

		subscriptionManager.start(clubUuid);
		dataLoader.clearData();
		await Promise.all([
			clubService.loadClubInfo(), // Uses auth.user.activeClubUuid
			dataLoader.loadInitialData()
		]);
	}

	/**
	 * Hydrate auth state from server-provided SSR data.
	 * Skips network calls — use ticket directly instead of refreshSession().
	 */
	hydrateFromServer(user: AuthUser, ticket: string): void {
		this.user = user;
		this.token = ticket;
		this.status = 'authenticated';
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
