import type { RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';

/**
 * Proxy the Discord OAuth callback to the backend.
 * The browser arrives here after Discord redirects back with `code` and `state`.
 * We forward the query params and the oauth_state cookie to the backend.
 * The backend validates the CSRF state, exchanges the code, sets the
 * refresh_token cookie, and redirects to the PWA base URL.
 * We forward the Set-Cookie headers and redirect the browser to the home page.
 */
export const GET: RequestHandler = async ({ fetch, request, url }) => {
	const backendUrl = new URL('/api/auth/discord/callback', serverConfig.backendUrl);
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
