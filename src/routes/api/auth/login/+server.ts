import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { hasTrustedOrigin, makeRequestId } from '$lib/server/security';
import { forwardSetCookieHeaders } from '$lib/server/http';

export const POST: RequestHandler = async ({ fetch, request, url }) => {
	if (!hasTrustedOrigin(request, url.origin)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { backendUrl } = serverConfig;
	const requestId = makeRequestId();

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
			console.error(`[Auth login ${requestId}] backend error`, { status: res.status });
			return json({ error: 'Login request failed', requestId }, { status: res.status });
		}

		const data = await res.json();

		const headers = new Headers();
		forwardSetCookieHeaders(res.headers, headers);

		return json(data, { headers });
	} catch (e) {
		console.error(`[Auth login ${requestId}] proxy error:`, e);
		return json({ error: 'Internal Server Error', requestId }, { status: 500 });
	}
};
