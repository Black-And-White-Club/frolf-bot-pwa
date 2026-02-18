import type { RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';

/**
 * Proxy the Discord OAuth link initiation to the backend.
 * Requires a valid refresh_token cookie (backend enforces this).
 * Sets link_mode + oauth_state cookies and redirects to Discord.
 *
 * GET /api/auth/discord/link
 */
export const GET: RequestHandler = async ({ fetch, request }) => {
	const res = await fetch(`${serverConfig.backendUrl}/api/auth/discord/link`, {
		redirect: 'manual',
		headers: { cookie: request.headers.get('cookie') || '' }
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
