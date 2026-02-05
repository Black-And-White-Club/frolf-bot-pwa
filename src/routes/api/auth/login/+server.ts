import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';

export const POST: RequestHandler = async ({ fetch, request }) => {
	const { backendUrl } = serverConfig;

	try {
		const body = await request.text();
		const res = await fetch(`${backendUrl}/api/auth/login`, {
			method: 'POST',
			headers: {
				'content-type': request.headers.get('content-type') || 'application/json',
				cookie: request.headers.get('cookie') || ''
			},
			body
		});

		if (!res.ok) {
			const error = await res.text();
			return json({ error }, { status: res.status });
		}

		const setCookie = res.headers.get('set-cookie');
		const data = await res.json();

		const headers = new Headers();
		if (setCookie) {
			headers.set('set-cookie', setCookie);
		}

		return json(data, { headers });
	} catch (e) {
		console.error('Login proxy error:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
