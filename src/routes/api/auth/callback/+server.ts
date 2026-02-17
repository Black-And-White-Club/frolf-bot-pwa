import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { hasTrustedOrigin, makeRequestId } from '$lib/server/security';
import { forwardSetCookieHeaders } from '$lib/server/http';

const MAGIC_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{16,4096}$/;

function isValidMagicToken(token: unknown): token is string {
	return typeof token === 'string' && MAGIC_TOKEN_PATTERN.test(token);
}

export const POST: RequestHandler = async ({ fetch, request, url }) => {
	if (!hasTrustedOrigin(request, url.origin)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	let token: unknown;
	try {
		const body = (await request.json()) as { token?: unknown };
		token = body.token;
	} catch {
		return json({ error: 'Invalid request payload' }, { status: 400 });
	}

	if (!isValidMagicToken(token)) {
		return json({ error: 'Invalid token format' }, { status: 400 });
	}

	const requestId = makeRequestId();
	const { backendUrl } = serverConfig;
	const cookie = request.headers.get('cookie') || '';

	try {
		const callbackUrl = new URL('/api/auth/callback', backendUrl);
		const res = await fetch(callbackUrl.toString(), {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				cookie
			},
			body: JSON.stringify({ token })
		});

		if (!res.ok) {
			console.error(`[Auth callback ${requestId}] backend error`, { status: res.status });
			return json({ error: 'Authentication failed', requestId }, { status: res.status });
		}

		const data = await res.json();

		const headers = new Headers();
		forwardSetCookieHeaders(res.headers, headers);

		return json(data, { headers });
	} catch (e) {
		console.error(`[Auth callback ${requestId}] proxy error:`, e);
		return json({ error: 'Internal Server Error', requestId }, { status: 500 });
	}
};

export const GET: RequestHandler = async () =>
	json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'POST' } });
