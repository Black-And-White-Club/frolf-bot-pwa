import type { RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';

/**
 * Proxy the Discord OAuth login initiation to the backend.
 * The backend generates the CSRF state, sets the oauth_state cookie,
 * and returns a 302 redirect to Discord's authorization page.
 * We forward both the cookie and the redirect to the browser.
 */
export const GET: RequestHandler = async ({ fetch, url }) => {
	const backendUrl = new URL('/api/auth/discord/login', serverConfig.backendUrl);
	url.searchParams.forEach((value, key) => {
		backendUrl.searchParams.set(key, value);
	});

	const res = await fetch(backendUrl.toString(), {
		redirect: 'manual'
	});

	const headers = new Headers();
	forwardSetCookieHeaders(res.headers, headers);

	const location = res.headers.get('location');
	if (!location) {
		return new Response('Bad gateway', { status: 502 });
	}

	headers.set('Location', location);
	return new Response(null, { status: 302, headers });
};
