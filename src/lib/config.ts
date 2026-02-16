import { env } from '$env/dynamic/public';

const DEFAULT_PUBLIC_API_URL = 'https://api.frolf-bot.com';
const DEFAULT_PUBLIC_API_HOST_ALLOWLIST = new Set(['api.frolf-bot.com', 'localhost', '127.0.0.1']);

function resolvePublicApiUrl(): string {
	if (import.meta.env.DEV) {
		// Use relative path in development to allow Vite proxy to handle CORS.
		return '';
	}

	const configuredUrl = env.PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL;
	try {
		const parsed = new URL(configuredUrl);
		const allowlist = new Set(DEFAULT_PUBLIC_API_HOST_ALLOWLIST);
		(env.PUBLIC_API_HOST_ALLOWLIST || '')
			.split(',')
			.map((host) => host.trim())
			.filter(Boolean)
			.forEach((host) => allowlist.add(host));

		if (!allowlist.has(parsed.hostname)) {
			console.error(`[config] PUBLIC_API_URL host not in allowlist: ${parsed.hostname}`);
			return DEFAULT_PUBLIC_API_URL;
		}

		return parsed.origin;
	} catch {
		console.error(`[config] Invalid PUBLIC_API_URL: ${configuredUrl}`);
		return DEFAULT_PUBLIC_API_URL;
	}
}

// Standardize configuration across the app
export const config = {
	nats: {
		url: env.PUBLIC_NATS_URL || env.PUBLIC_WS_URL || 'wss://nats.frolf-bot.com:443',
		reconnectAttempts: 10,
		reconnectDelayMs: 1000
	},
	otel: {
		endpoint: env.PUBLIC_OTEL_ENDPOINT || 'http://localhost:4318/v1/traces',
		serviceName: 'frolf-pwa',
		serviceVersion: '0.4.0'
	},
	api: {
		url: resolvePublicApiUrl()
	},
	mock: {
		enabled: env.PUBLIC_USE_MOCK === 'true'
	},
	debug: env.PUBLIC_DEBUG === 'true'
} as const;

export function log(...args: unknown[]): void {
	if (config.debug) {
		console.log('[frolf-pwa]', ...args);
	}
}
