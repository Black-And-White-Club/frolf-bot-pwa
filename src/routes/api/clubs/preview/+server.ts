import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';

export const GET: RequestHandler = async ({ fetch, url }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		return json({ error: 'Missing code parameter' }, { status: 400 });
	}

	const backendUrl = new URL('/api/clubs/preview', serverConfig.backendUrl);
	backendUrl.searchParams.set('code', code);

	const res = await fetch(backendUrl.toString());
	const data = await res.json().catch(() => ({ error: 'Request failed' }));
	return json(data, { status: res.status });
};
