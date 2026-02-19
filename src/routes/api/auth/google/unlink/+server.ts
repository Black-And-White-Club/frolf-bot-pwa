import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';

export const DELETE: RequestHandler = async ({ fetch, request }) => {
	const res = await fetch(`${serverConfig.backendUrl}/api/auth/google/unlink`, {
		method: 'DELETE',
		headers: { cookie: request.headers.get('cookie') || '' }
	});
	const headers = new Headers();
	forwardSetCookieHeaders(res.headers, headers);
	const body = await res.json().catch(() => ({}));
	return json(body, { status: res.status, headers });
};
