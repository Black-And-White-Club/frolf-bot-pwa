import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { isE2EMode } from '$lib/server/e2e';

/**
 * GET  /api/clubs/:uuid/invites  — list all invite codes for a club
 * POST /api/clubs/:uuid/invites  — create a new invite code
 */

export const GET: RequestHandler = async ({ fetch, request, params }) => {
	try {
		const res = await fetch(`${serverConfig.backendUrl}/api/clubs/${params.uuid}/invites`, {
			headers: { cookie: request.headers.get('cookie') || '' }
		});
		const data = await res.json().catch(() => ({ error: 'Request failed' }));
		return json(data, { status: res.status });
	} catch (err) {
		if (isE2EMode) {
			console.warn('[E2E] clubs/invites backend unreachable, returning empty fallback');
			return json([], { status: 200 });
		}
		throw err;
	}
};

export const POST: RequestHandler = async ({ fetch, request, params }) => {
	const body = await request.json().catch(() => null);
	const res = await fetch(`${serverConfig.backendUrl}/api/clubs/${params.uuid}/invites`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			cookie: request.headers.get('cookie') || ''
		},
		body: JSON.stringify(body)
	});
	const data = await res.json().catch(() => ({ error: 'Request failed' }));
	return json(data, { status: res.status });
};
