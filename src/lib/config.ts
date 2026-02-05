import { env } from '$env/dynamic/public';

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
		// Use relative path in development to allow Vite proxy to handle CORS
		url: import.meta.env.DEV ? '' : (env.PUBLIC_API_URL || 'https://api.frolf-bot.com')
	},
	mock: {
		enabled: env.PUBLIC_USE_MOCK === 'true'
	},
	debug: env.PUBLIC_DEBUG === 'true' || true // Enable debug by default for now to help the user
} as const;

export function log(...args: unknown[]): void {
	if (config.debug) {
		console.log('[frolf-pwa]', ...args);
	}
}
