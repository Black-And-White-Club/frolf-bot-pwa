// src/lib/stores/auth.svelte.ts

interface AuthUser {
	id: string;
	guildId: string;
	role: 'viewer' | 'player' | 'editor' | 'admin';
}

interface TokenClaims {
	sub: string; // user:{discord_id}
	guild: string; // guild ID
	role: string; // permission level
	exp: number; // expiry timestamp
	iat: number; // issued at
}

class AuthService {
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
	 * Initialize auth state
	 * Checks sessionStorage first, then URL parameter
	 */
	initialize(): void {
		if (typeof window === 'undefined') return;

		this.status = 'validating';

		// Try to get token from sessionStorage
		let token = sessionStorage.getItem('auth_token');

		// If not found, check URL
		if (!token) {
			token = this.extractTokenFromUrl();
		}

		if (!token) {
			this.status = 'idle';
			return;
		}

		// Validate token
		const claims = this.validateToken(token);

		if (!claims) {
			this.error = 'Invalid or expired token';
			this.status = 'error';
			sessionStorage.removeItem('auth_token');
			return;
		}

		// Store token and set user from claims
		sessionStorage.setItem('auth_token', token);
		this.token = token;

		// Extract user ID from sub (format: "user:{discord_id}")
		const userId = claims.sub.replace('user:', '');

		this.user = {
			id: userId,
			guildId: claims.guild,
			role: claims.role as AuthUser['role']
		};

		this.status = 'authenticated';
		this.error = null;
	}

	/**
	 * Sign out and clear all auth state
	 */
	signOut(): void {
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
