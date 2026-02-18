import type { RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';

/**
 * Proxy the Google OAuth callback to the backend.
 */
export const GET: RequestHandler = async ({ fetch, request, url }) => {
	const backendUrl = new URL('/api/auth/google/callback', serverConfig.backendUrl);
	url.searchParams.forEach((value, key) => {
		backendUrl.searchParams.set(key, value);
	});

	const res = await fetch(backendUrl.toString(), {
		redirect: 'manual',
		headers: {
			cookie: request.headers.get('cookie') || ''
		}
	});

	const headers = new Headers();
	forwardSetCookieHeaders(res.headers, headers);

	if (res.status >= 400) {
		headers.set('Location', '/auth/signin?error=oauth_failed');
		return new Response(null, { status: 302, headers });
	}

	headers.set('Location', '/');
	return new Response(null, { status: 302, headers });
};
