import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { serverConfig } from '$lib/server/config';

vi.mock('$lib/server/config', () => ({
	serverConfig: {
		backendUrl: 'http://backend'
	}
}));

vi.mock('$lib/server/http', () => ({
	forwardSetCookieHeaders: (from: Headers, to: Headers) => {
		const cookie = from.get('set-cookie');
		if (cookie) to.set('set-cookie', cookie);
	}
}));

describe('GET /api/auth/discord/callback', () => {
	let mockFetch: any;
	let mockRequest: any;
	let mockUrl: URL;

	beforeEach(() => {
		mockFetch = vi.fn();
		mockRequest = {
			headers: new Headers()
		};
		mockUrl = new URL('http://pwa/api/auth/discord/callback?code=abc&state=xyz');
	});

	it('redirects to signin with error on backend failure', async () => {
		mockFetch.mockResolvedValue({
			status: 401,
			headers: new Headers()
		});

		const res = await GET({ fetch: mockFetch, request: mockRequest, url: mockUrl } as any);

		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('/auth/signin?error=oauth_failed');
	});

	it('extracts path from backend location (full URL)', async () => {
		mockFetch.mockResolvedValue({
			status: 302,
			headers: new Headers({
				'location': 'https://frolf-bot.duckdns.org/account'
			})
		});

		const res = await GET({ fetch: mockFetch, request: mockRequest, url: mockUrl } as any);

		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('/account');
	});

	it('handles link failure cleanup redirect', async () => {
		mockFetch.mockResolvedValue({
			status: 302,
			headers: new Headers({
				'location': 'https://frolf-bot.duckdns.org/account?error=link_failed'
			})
		});

		const res = await GET({ fetch: mockFetch, request: mockRequest, url: mockUrl } as any);

		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('/account?error=link_failed');
	});

	it('redirects to / if no backend location', async () => {
		mockFetch.mockResolvedValue({
			status: 302, // Odd case, but possible if backend logic flaws
			headers: new Headers({})
		});

		const res = await GET({ fetch: mockFetch, request: mockRequest, url: mockUrl } as any);

		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('/');
	});

	it('forwards query params to backend', async () => {
		mockFetch.mockResolvedValue({
			status: 302,
			headers: new Headers({ location: 'https://pwa' })
		});

		await GET({ fetch: mockFetch, request: mockRequest, url: mockUrl } as any);

		const expectedUrl = 'http://backend/api/auth/discord/callback?code=abc&state=xyz';
		expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expect.anything());
	});
});
