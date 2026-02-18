import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';

export const POST: RequestHandler = async ({ fetch, request }) => {
	const body = await request.json().catch(() => null);
	if (!body?.club_uuid) {
		return json({ error: 'Missing club_uuid' }, { status: 400 });
	}

	const res = await fetch(`${serverConfig.backendUrl}/api/clubs/join`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			cookie: request.headers.get('cookie') || ''
		},
		body: JSON.stringify(body)
	});

	const data = await res.json().catch(() => ({ error: 'Request failed' }));
	return json(data, { status: res.status });
};
