import { config } from '$lib/config';
import { browser } from '$app/environment';

/**
 * Base URL for Activity API calls.
 *
 * In production the Activity runs inside Discord's iframe. Discord's root URL
 * mapping proxies discordsays.com → frolf-bot.duckdns.org, so same-origin
 * requests are forwarded transparently.
 * In development Vite proxies requests directly to the local backend.
 */
export function activityApiUrl(): string {
	if (!import.meta.env.DEV) {
		return '';
	}
	return config.api.url || 'http://localhost:8080';
}

/**
 * NATS WebSocket URL for Activity use.
 *
 * When running inside Discord's proxy (discordsays.com), use a same-origin
 * WebSocket URL so it passes the meta CSP's connect-src 'self' and Discord
 * forwards the connection via its root URL mapping.
 */
export function activityNatsUrl(): string {
	if (browser && window.location.hostname.endsWith('discordsays.com')) {
		const natsPath = new URL(config.nats.url).pathname;
		return `wss://${window.location.host}${natsPath}`;
	}
	return config.nats.url;
}
