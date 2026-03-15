import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { hasTrustedOrigin } from '$lib/server/security';

export const GET: RequestHandler = async ({ fetch, request, url }) => {
	if (!hasTrustedOrigin(request, url.origin)) {
		return json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
	}

	const clubUuid = url.searchParams.get('club_uuid')?.trim();
	if (!clubUuid) {
		return json({ error: 'Missing club_uuid', code: 'missing_club_uuid' }, { status: 400 });
	}

	const backendUrl = new URL('/api/betting/overview', serverConfig.backendUrl);
	backendUrl.searchParams.set('club_uuid', clubUuid);

	const res = await fetch(backendUrl.toString(), {
		headers: {
			Accept: 'application/json',
			cookie: request.headers.get('cookie') || ''
		}
	});

	const data = await res.json().catch(() => ({ error: 'Request failed', code: 'proxy_error' }));
	return json(data, { status: res.status });
};
