import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { isE2EMode } from '$lib/server/e2e';

export const GET: RequestHandler = async ({ fetch, request }) => {
	try {
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
	} catch (err) {
		if (isE2EMode) {
			return json([], { status: 200 });
		}
		throw err;
	}
};
