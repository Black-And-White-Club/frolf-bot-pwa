import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { serverConfig } from '$lib/server/config';

// Mock config
vi.mock('$lib/server/config', () => ({
	serverConfig: {
		backendUrl: 'http://backend'
	}
}));

// Mock http helper
vi.mock('$lib/server/http', () => ({
	forwardSetCookieHeaders: (from: Headers, to: Headers) => {
		const cookie = from.get('set-cookie');
		if (cookie) to.set('set-cookie', cookie);
	}
}));

describe('GET /api/auth/discord/link', () => {
	let mockFetch: any;
	let mockRequest: any;

	beforeEach(() => {
		mockFetch = vi.fn();
		mockRequest = {
			headers: new Headers()
		};
	});

	it('redirects to provider on success', async () => {
		mockFetch.mockResolvedValue({
			headers: new Headers({
				location: 'https://discord.com/authorize',
				'set-cookie': 'oauth_state=xyz; Path=/'
			})
		});

		const res = await GET({ fetch: mockFetch, request: mockRequest } as any);

		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('https://discord.com/authorize');
		expect(res.headers.get('set-cookie')).toBe('oauth_state=xyz; Path=/');
		expect(mockFetch).toHaveBeenCalledWith(
			'http://backend/api/auth/discord/link',
			expect.objectContaining({
				redirect: 'manual'
			})
		);
	});

	it('returns 502 if backend returns no location', async () => {
		mockFetch.mockResolvedValue({
			headers: new Headers({})
		});

		const res = await GET({ fetch: mockFetch, request: mockRequest } as any);

		expect(res.status).toBe(502);
	});

	it('forwards cookies to backend', async () => {
		mockRequest.headers.set('cookie', 'refresh_token=valid');
		mockFetch.mockResolvedValue({
			headers: new Headers({ location: 'https://discord.com' })
		});

		await GET({ fetch: mockFetch, request: mockRequest } as any);

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining('/api/auth/discord/link'),
			expect.objectContaining({
				headers: expect.objectContaining({
					cookie: 'refresh_token=valid'
				})
			})
		);
	});
});
