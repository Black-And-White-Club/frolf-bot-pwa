import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { hasTrustedOrigin } from '$lib/server/security';

type MarketActionRequest = {
	club_uuid?: unknown;
	market_id?: unknown;
	action?: unknown;
	reason?: unknown;
};

export const POST: RequestHandler = async ({ fetch, request, url }) => {
	if (!hasTrustedOrigin(request, url.origin)) {
		return json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as MarketActionRequest | null;
	if (
		!body ||
		typeof body.club_uuid !== 'string' ||
		typeof body.market_id !== 'number' ||
		typeof body.action !== 'string' ||
		typeof body.reason !== 'string'
	) {
		return json({ error: 'Invalid request body', code: 'invalid_request' }, { status: 400 });
	}

	const res = await fetch(`${serverConfig.backendUrl}/api/betting/admin/market-actions`, {
		method: 'POST',
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
