import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';

/**
 * DELETE /api/clubs/:uuid/invites/:code  — revoke an invite code
 */
export const DELETE: RequestHandler = async ({ fetch, request, params }) => {
	const res = await fetch(
		`${serverConfig.backendUrl}/api/clubs/${params.uuid}/invites/${params.code}`,
		{
			method: 'DELETE',
			headers: { cookie: request.headers.get('cookie') || '' }
		}
	);
	if (res.status === 204) {
		return new Response(null, { status: 204 });
	}
	const data = await res.json().catch(() => ({ error: 'Request failed' }));
	return json(data, { status: res.status });
};
