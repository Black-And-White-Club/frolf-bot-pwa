/**
 * Activity Auth Service
 *
 * Handles Discord Activity authentication via the Embedded App SDK.
 * Tokens live in JS memory only — no cookies, no localStorage.
 * Refreshes the NATS ticket via Authorization: Bearer header.
 */

import { activityApiUrl } from '$lib/activity-utils';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type TokenExchangeResponse = {
	refresh_token: string;
	ticket: string;
	user_uuid: string;
};

function isTokenExchangeResponse(data: unknown): data is TokenExchangeResponse {
	if (!data || typeof data !== 'object') return false;
	const d = data as Record<string, unknown>;
	return (
		typeof d.refresh_token === 'string' &&
		typeof d.ticket === 'string' &&
		typeof d.user_uuid === 'string'
	);
}

class ActivityAuth {
	refreshToken = $state<string | null>(null);
	ticket = $state<string | null>(null);
	userUUID = $state<string | null>(null);
	status = $state<'idle' | 'authenticating' | 'authenticated' | 'error'>('idle');
	error = $state<string | null>(null);

	get isAuthenticated() {
		return this.status === 'authenticated';
	}

	get authHeader(): Record<string, string> {
		return this.refreshToken ? { Authorization: `Bearer ${this.refreshToken}` } : {};
	}

	async authenticate(code: string): Promise<void> {
		this.status = 'authenticating';
		this.error = null;

		const maxRetries = 3;
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const data = await this.fetchTokenExchange(code);
				this.refreshToken = data.refresh_token;
				this.ticket = data.ticket;
				this.userUUID = data.user_uuid;
				this.status = 'authenticated';
				return;
			} catch (e) {
				const noRetry = e instanceof Error && (e as any).noRetry;
				if (!noRetry && attempt < maxRetries) {
					await delay(1000 * 2 ** attempt); // 1s, 2s, 4s
					continue;
				}
				this.error = e instanceof Error ? e.message : 'Authentication failed';
				this.status = 'error';
				return;
			}
		}
	}

	private async fetchTokenExchange(code: string): Promise<TokenExchangeResponse> {
		const res = await fetch(`${activityApiUrl()}/api/auth/discord-activity/token-exchange`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code })
		});
		// 401 means the code was rejected by Discord (invalid_grant / already used).
		// OAuth codes are one-time-use — retrying with the same code will always fail.
		// Throw a non-retryable sentinel so the retry loop can bail out immediately.
		if (res.status === 401)
			throw Object.assign(new Error('Token exchange failed: 401'), { noRetry: true });
		// 429 and 5xx are retryable — the caller's backoff loop handles them.
		if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
		const data: unknown = await res.json();
		if (!isTokenExchangeResponse(data)) {
			throw new Error('Unexpected response shape from token exchange');
		}
		return data;
	}

	/** Refresh the NATS ticket. Returns the new ticket or null on failure. */
	async refreshSession(): Promise<string | null> {
		if (!this.refreshToken) return null;
		try {
			const res = await fetch(`${activityApiUrl()}/api/auth/ticket`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${this.refreshToken}` }
			});
			if (!res.ok) {
				this.error = `Session refresh failed: ${res.status}`;
				this.status = 'error';
				return null;
			}
			const data = await res.json();
			this.ticket = data.ticket;
			if (data.refresh_token) this.refreshToken = data.refresh_token;
			return data.ticket as string;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Session refresh failed';
			this.status = 'error';
			return null;
		}
	}

	reset(): void {
		this.refreshToken = null;
		this.ticket = null;
		this.userUUID = null;
		this.status = 'idle';
		this.error = null;
	}
}

export const activityAuth = new ActivityAuth();
