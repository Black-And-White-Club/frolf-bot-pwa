import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

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

describe('GET /api/auth/discord/login', () => {
	let mockFetch: any;
	let mockUrl: URL;

	beforeEach(() => {
		mockFetch = vi.fn();
		mockUrl = new URL('http://pwa/api/auth/discord/login');
	});

	it('forwards provider redirect and set-cookie headers', async () => {
		mockFetch.mockResolvedValue({
			headers: new Headers({
				location: 'https://discord.com/oauth2/authorize',
				'set-cookie': 'oauth_state=xyz; Path=/'
			})
		});

		const res = await GET({ fetch: mockFetch, url: mockUrl } as any);

		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('https://discord.com/oauth2/authorize');
		expect(res.headers.get('set-cookie')).toBe('oauth_state=xyz; Path=/');
	});

	it('returns 502 when backend does not provide a location header', async () => {
		mockFetch.mockResolvedValue({
			headers: new Headers({})
		});

		const res = await GET({ fetch: mockFetch, url: mockUrl } as any);

		expect(res.status).toBe(502);
	});

	it('forwards query params to backend', async () => {
		mockUrl = new URL('http://pwa/api/auth/discord/login?redirect=%2Fjoin%3Fcode%3Dabc');
		mockFetch.mockResolvedValue({
			headers: new Headers({
				location: 'https://discord.com/oauth2/authorize'
			})
		});

		await GET({ fetch: mockFetch, url: mockUrl } as any);

		expect(mockFetch).toHaveBeenCalledWith(
			'http://backend/api/auth/discord/login?redirect=%2Fjoin%3Fcode%3Dabc',
			expect.anything()
		);
	});
});
