import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';

export const GET: RequestHandler = async ({ fetch, request }) => {
	const { backendUrl } = serverConfig;
	
	try {
		const res = await fetch(`${backendUrl}/api/auth/ticket`, {
			method: 'GET',
			headers: {
				cookie: request.headers.get('cookie') || ''
			}
		});

		if (!res.ok) {
			// If backend returns 401/403, we should clear session
			if (res.status === 401 || res.status === 403) {
				return json({ error: 'Unauthorized' }, { status: 401 });
			}
			const error = await res.text();
			return json({ error }, { status: res.status });
		}

		// Forward the Set-Cookie header (token rotation)
		const setCookie = res.headers.get('set-cookie');
		const data = await res.json();

		const headers = new Headers();
		if (setCookie) {
			headers.set('set-cookie', setCookie);
		}

		return json(data, { headers });
	} catch (e) {
		console.error('Ticket proxy error:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
