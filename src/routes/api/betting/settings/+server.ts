import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { hasTrustedOrigin } from '$lib/server/security';

type SettingsRequest = {
	club_uuid?: unknown;
	opt_out_targeting?: unknown;
};

export const PATCH: RequestHandler = async ({ fetch, request, url }) => {
	if (!hasTrustedOrigin(request, url.origin)) {
		return json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as SettingsRequest | null;
	if (!body || typeof body.club_uuid !== 'string' || typeof body.opt_out_targeting !== 'boolean') {
		return json({ error: 'Invalid request body', code: 'invalid_request' }, { status: 400 });
	}

	const res = await fetch(`${serverConfig.backendUrl}/api/betting/settings`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			cookie: request.headers.get('cookie') || ''
		},
		body: JSON.stringify(body)
	});

	const data = await res.json().catch(() => ({ error: 'Request failed', code: 'proxy_error' }));
	return json(data, { status: res.status });
};
