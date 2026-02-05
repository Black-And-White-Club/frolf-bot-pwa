import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';

export const POST: RequestHandler = async ({ fetch, request }) => {
	const { backendUrl } = serverConfig;

	try {
		const res = await fetch(`${backendUrl}/api/auth/logout`, {
			method: 'POST',
			headers: {
				cookie: request.headers.get('cookie') || ''
			}
		});

		// Forward the Set-Cookie (clearing the cookie)
		const setCookie = res.headers.get('set-cookie');
		const headers = new Headers();
		if (setCookie) {
			headers.set('set-cookie', setCookie);
		}

		return new Response(null, { status: res.status, headers });
	} catch (e) {
		console.error('Logout proxy error:', e);
		return new Response(null, { status: 500 });
	}
};
