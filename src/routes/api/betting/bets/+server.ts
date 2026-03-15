import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { hasTrustedOrigin } from '$lib/server/security';

type BetRequest = {
	club_uuid?: unknown;
	round_id?: unknown;
	selection_key?: unknown;
	stake?: unknown;
	market_type?: unknown;
	idempotency_key?: unknown;
};

export const POST: RequestHandler = async ({ fetch, request, url }) => {
	if (!hasTrustedOrigin(request, url.origin)) {
		return json({ error: 'Forbidden', code: 'forbidden' }, { status: 403 });
	}

	const body = (await request.json().catch(() => null)) as BetRequest | null;
	if (
		!body ||
		typeof body.club_uuid !== 'string' ||
		typeof body.round_id !== 'string' ||
		typeof body.selection_key !== 'string' ||
		typeof body.stake !== 'number'
	) {
		return json({ error: 'Invalid request body', code: 'invalid_request' }, { status: 400 });
	}

	const res = await fetch(`${serverConfig.backendUrl}/api/betting/bets`, {
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
