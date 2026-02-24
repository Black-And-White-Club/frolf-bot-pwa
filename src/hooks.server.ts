import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

const isDev = import.meta.env.DEV;

function toOrigin(value: string | undefined): string | null {
	if (!value) return null;
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

// Minimal security headers suitable for this app.
// CSP is partially handled in svelte.config.ts (nonces).
// We dynamically append connect-src here.
export const handle: Handle = async ({ event, resolve }) => {
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
