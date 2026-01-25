export const config = {
	nats: {
		url: import.meta.env.VITE_NATS_URL || 'wss://nats.frolf-bot.com:443',
		reconnectAttempts: 10,
		reconnectDelayMs: 1000
	},
	otel: {
		endpoint: import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318/v1/traces',
		serviceName: 'frolf-pwa',
		serviceVersion: '0.4.0'
	},
	api: {
		url: import.meta.env.VITE_API_URL || 'https://api.frolf-bot.com'
	},
	mock: {
		enabled: import.meta.env.VITE_USE_MOCK === 'true'
	},
	debug: import.meta.env.VITE_DEBUG === 'true'
} as const;

export function log(...args: unknown[]): void {
	if (config.debug) {
		console.log('[frolf-pwa]', ...args);
	}
}
