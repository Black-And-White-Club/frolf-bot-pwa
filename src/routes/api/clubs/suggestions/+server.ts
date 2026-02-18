import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';

export const GET: RequestHandler = async ({ fetch, request }) => {
	const res = await fetch(`${serverConfig.backendUrl}/api/clubs/suggestions`, {
		headers: {
			cookie: request.headers.get('cookie') || ''
		}
	});

	if (!res.ok) {
		const data = await res.json().catch(() => ({ error: 'Request failed' }));
		return json(data, { status: res.status });
	}

	const data = await res.json();
	return json(data);
};
