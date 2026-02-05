import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';

export const GET: RequestHandler = async ({ url, fetch, request }) => {
	const token = url.searchParams.get('t');
	const { backendUrl } = serverConfig;
	
	try {
		const res = await fetch(`${backendUrl}/api/auth/callback?t=${token}`, {
			method: 'GET',
			headers: {
				cookie: request.headers.get('cookie') || ''
			}
		});

		if (!res.ok) {
			const error = await res.text();
			return json({ error }, { status: res.status });
		}

		// Forward the Set-Cookie header from the backend
		const setCookie = res.headers.get('set-cookie');
		const data = await res.json();

		const headers = new Headers();
		if (setCookie) {
			headers.set('set-cookie', setCookie);
		}

		return json(data, { headers });
	} catch (e) {
		console.error('Callback proxy error:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
