import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';
import type { AuthUser, TokenClaims } from '$lib/stores/auth.svelte';

const isDev = import.meta.env.DEV;

function toOrigin(value: string | undefined): string | null {
	if (!value) return null;
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

function parseJwtServer(token: string): TokenClaims | null {
	try {
		const payload = token.split('.')[1];
		const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
			'utf8'
		);
		const claims = JSON.parse(decoded) as TokenClaims;
		if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
		return claims;
	} catch {
		return null;
	}
}

function claimsToUser(claims: TokenClaims): AuthUser {
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

const authHandle: Handle = async ({ event, resolve }) => {
	// Skip API routes — they handle auth themselves
	if (event.url.pathname.startsWith('/api/')) return resolve(event);

	const refreshToken = event.cookies.get('refresh_token');
	if (!refreshToken) return resolve(event);

	try {
		const res = await fetch(`${serverConfig.backendUrl}/api/auth/ticket`, {
			method: 'GET',
			headers: { cookie: `refresh_token=${refreshToken}` }
		});

		if (res.ok) {
			const { ticket } = (await res.json()) as { ticket?: string };
			if (ticket) {
				const claims = parseJwtServer(ticket);
				if (claims) {
					event.locals.user = claimsToUser(claims);
					event.locals.ticket = ticket;
				}
				// Forward rotated refresh_token cookie from backend response
				const rotatedHeaders = new Headers();
				forwardSetCookieHeaders(res.headers, rotatedHeaders);
				const response = await resolve(event);
				rotatedHeaders.forEach((value, key) => response.headers.append(key, value));
				return response;
			}
		}
	} catch {
		// Silent — treat as unauthenticated
	}

	return resolve(event);
};

// Minimal security headers suitable for this app.
// CSP is partially handled in svelte.config.ts (nonces).
// We dynamically append connect-src here.
const cspHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	const connectSrc = new Set<string>(["'self'", 'https://api.github.com']);
	connectSrc.add(toOrigin(env.PUBLIC_API_URL) || 'https://api.frolf-bot.com');
	connectSrc.add(toOrigin(env.PUBLIC_NATS_URL || env.PUBLIC_WS_URL) || 'wss://nats.frolf-bot.com');
	if (env.PUBLIC_OTEL_ENDPOINT) {
		const otelOrigin = toOrigin(env.PUBLIC_OTEL_ENDPOINT);
		if (otelOrigin) connectSrc.add(otelOrigin);
	}

	if (isDev) {
		connectSrc.add('http://localhost:5173');
		connectSrc.add('ws://localhost:5173');
		connectSrc.add('http://localhost:8080');
		connectSrc.add('ws://localhost:8080');
	}

	// Retrieve CSP if SvelteKit already set it (from svelte.config.js)
	let csp = response.headers.get('Content-Security-Policy') || '';
	const connectSrcPolicy = `connect-src ${Array.from(connectSrc).join(' ')}`;

	if (csp) {
		// connect-src is intentionally omitted from svelte.config.ts — managed here dynamically.
		csp = csp.includes('connect-src')
			? csp.replace(/connect-src[^;]*/, connectSrcPolicy)
			: `${csp}; ${connectSrcPolicy}`;
	} else {
		// Fallback for non-HTML responses (API routes, etc.) where SvelteKit's nonce
		// CSP doesn't run. Apply the full policy so these routes remain protected.
		csp = [
			"default-src 'self'",
			"object-src 'none'",
			"base-uri 'self'",
			"frame-ancestors 'none'",
			connectSrcPolicy
		].join('; ');
	}

	response.headers.set('Content-Security-Policy', csp);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
	response.headers.set('X-XSS-Protection', '0');

	return response;
};

export const handle = sequence(authHandle, cspHandle);
