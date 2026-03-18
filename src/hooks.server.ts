import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';
import type { AuthUser, TokenClaims } from '$lib/stores/auth.svelte';
import { initServerOtel, getServerTracer, getServerMeter, emitServerLog } from '$lib/server/otel';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { SpanStatusCode } from '@opentelemetry/api';
import {
	ATTR_HTTP_REQUEST_METHOD,
	ATTR_HTTP_ROUTE,
	ATTR_URL_PATH,
	ATTR_HTTP_RESPONSE_STATUS_CODE
} from '@opentelemetry/semantic-conventions';

// Initialize server-side OTel once at module load time.
initServerOtel();

const isDev = import.meta.env.DEV;

// Instruments are created once at module scope to avoid per-request allocation leaks.
const _tracer = getServerTracer();
const _meter = getServerMeter();
const _requestCount = _meter.createCounter('http.server.request.count', {
	description: 'Total HTTP requests handled by the SvelteKit server'
});
const _requestDuration = _meter.createHistogram('http.server.request.duration', {
	description: 'HTTP request duration in milliseconds',
	unit: 'ms'
});

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
		activeClubEntitlements: claims.active_club_entitlements || {},
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

function buildConnectSrc(): string {
	const origins = new Set<string>(["'self'", 'https://api.github.com']);
	origins.add(toOrigin(env.PUBLIC_API_URL) || 'https://api.frolf-bot.com');
	origins.add(toOrigin(env.PUBLIC_NATS_URL || env.PUBLIC_WS_URL) || 'wss://nats.frolf-bot.com');
	if (env.PUBLIC_OTEL_ENDPOINT) {
		const otelOrigin = toOrigin(env.PUBLIC_OTEL_ENDPOINT);
		if (otelOrigin) origins.add(otelOrigin);
	}
	if (isDev) {
		origins.add('http://localhost:5173');
		origins.add('ws://localhost:5173');
		origins.add('http://localhost:8080');
		origins.add('ws://localhost:8080');
	}
	return `connect-src ${Array.from(origins).join(' ')}`;
}

// Minimal security headers suitable for this app.
// CSP is partially handled in svelte.config.ts (nonces).
// We dynamically append connect-src here.
const cspHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	const connectSrcPolicy = buildConnectSrc();

	// Retrieve CSP if SvelteKit already set it (from svelte.config.js)
	let csp = response.headers.get('Content-Security-Policy') || '';

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
			"frame-ancestors 'none' https://discord.com https://*.discord.com https://*.discordsays.com",
			connectSrcPolicy
		].join('; ');
	}

	response.headers.set('Content-Security-Policy', csp);
	if (!event.url.pathname.startsWith('/activity')) {
		response.headers.set('X-Frame-Options', 'DENY');
	}
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
	response.headers.set('X-XSS-Protection', '0');

	return response;
};

// Instrument every incoming HTTP request: span, duration metric, error logging.
const otelHandle: Handle = async ({ event, resolve }) => {
	const route = event.route.id ?? event.url.pathname;
	const method = event.request.method;
	const startMs = performance.now();

	return _tracer.startActiveSpan(`${method} ${route}`, async (span) => {
		span.setAttributes({
			[ATTR_HTTP_REQUEST_METHOD]: method,
			[ATTR_HTTP_ROUTE]: route,
			[ATTR_URL_PATH]: event.url.pathname
		});

		try {
			const response = await resolve(event);
			const status = response.status;
			const durationMs = performance.now() - startMs;

			span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, status);
			if (status >= 500) {
				span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${status}` });
				emitServerLog(SeverityNumber.ERROR, `${method} ${route} → ${status}`, {
					[ATTR_HTTP_REQUEST_METHOD]: method,
					[ATTR_HTTP_ROUTE]: route,
					[ATTR_HTTP_RESPONSE_STATUS_CODE]: status
				});
			} else if (status >= 400) {
				emitServerLog(SeverityNumber.WARN, `${method} ${route} → ${status}`, {
					[ATTR_HTTP_REQUEST_METHOD]: method,
					[ATTR_HTTP_ROUTE]: route,
					[ATTR_HTTP_RESPONSE_STATUS_CODE]: status
				});
			}

			_requestCount.add(1, {
				[ATTR_HTTP_REQUEST_METHOD]: method,
				[ATTR_HTTP_ROUTE]: route,
				[ATTR_HTTP_RESPONSE_STATUS_CODE]: status
			});
			_requestDuration.record(durationMs, {
				[ATTR_HTTP_REQUEST_METHOD]: method,
				[ATTR_HTTP_ROUTE]: route,
				[ATTR_HTTP_RESPONSE_STATUS_CODE]: status
			});

			span.end();

			return response;
		} catch (err) {
			span.recordException(err as Error);
			span.setStatus({ code: SpanStatusCode.ERROR });
			span.end();
			throw err;
		}
	});
};

export const handle = sequence(otelHandle, authHandle, cspHandle);
