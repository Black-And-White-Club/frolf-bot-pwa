import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_VITE_NATS_URL: 'wss://mock-nats',
		PUBLIC_VITE_OTEL_ENDPOINT: 'http://mock-otel',
		PUBLIC_VITE_API_URL: 'https://mock-api',
		PUBLIC_VITE_USE_MOCK: 'true',
		PUBLIC_VITE_DEBUG: 'false'
	}
}));

// Ensure the root layout Svelte file can be imported in a Node environment
// without throwing due to accidental top-level browser global access.

describe('SSR import safety - layout', () => {
	it('imports +layout.svelte without throwing', async () => {
		await expect(import('../../src/routes/+layout.svelte')).resolves.toBeTruthy();
	});
});
