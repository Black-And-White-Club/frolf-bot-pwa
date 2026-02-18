import type { RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';

/**
 * Proxy the Google OAuth login initiation to the backend.
 */
export const GET: RequestHandler = async ({ fetch }) => {
	const res = await fetch(`${serverConfig.backendUrl}/api/auth/google/login`, {
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
