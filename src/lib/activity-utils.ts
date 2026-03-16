import { config } from '$lib/config';

/**
 * Base URL for Activity API calls.
 *
 * In production the Activity is served inside Discord's iframe and all API
 * calls are proxied via /.proxy/api → frolf-bot.duckdns.org.
 * In development Vite proxies requests directly to the local backend.
 */
export function activityApiUrl(): string {
	if (!import.meta.env.DEV) {
		return '/.proxy/api';
	}
	return config.api.url || 'http://localhost:8080';
}
