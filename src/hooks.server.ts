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

// Minimal security headers and CSP suitable for this app. Adjust as needed for
// external integrations (analytics, CDNs, etc.). This runs for every request
// and sets common security headers Lighthouse wants to see.
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

	// SvelteKit injects an inline bootstrap script in %sveltekit.body% during SSR pages.
	// Keep script-src strict to self + required inline bootstrap support.
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self'",
		"style-src-elem 'self'",
		"style-src-attr 'unsafe-inline'",
		"img-src 'self' data: https://images.unsplash.com https://*.githubusercontent.com https://cdn.discordapp.com",
		"font-src 'self' data:",
		"manifest-src 'self'",
		`connect-src ${Array.from(connectSrc).join(' ')}`,
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"object-src 'none'"
	].join('; ');

	response.headers.set('Content-Security-Policy', csp);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
	response.headers.set('X-XSS-Protection', '0');

	return response;
};
