export const env = {
	PUBLIC_API_URL: 'http://localhost:8080',
	PUBLIC_API_HOST_ALLOWLIST: 'localhost,127.0.0.1',
	PUBLIC_NATS_URL: 'ws://localhost:4222',
	PUBLIC_WS_URL: 'ws://localhost:4222',
	PUBLIC_OTEL_ENDPOINT: '',
	PUBLIC_USE_MOCK: 'true',
	PUBLIC_DEBUG: 'false'
} as const;
