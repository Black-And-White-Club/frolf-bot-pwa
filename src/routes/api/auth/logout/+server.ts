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
		const res = await fetch(`${backendUrl}/api/auth/logout`, {
			method: 'POST',
			headers: {
				cookie: request.headers.get('cookie') || ''
			}
		});

		const headers = new Headers();
		forwardSetCookieHeaders(res.headers, headers);

		return new Response(null, { status: res.status, headers });
	} catch (e) {
		console.error(`[Auth logout ${requestId}] proxy error:`, e);
		return json({ error: 'Internal Server Error', requestId }, { status: 500 });
	}
};
