import { json, type RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { hasTrustedOrigin, makeRequestId } from '$lib/server/security';
import { forwardSetCookieHeaders } from '$lib/server/http';

const CLUB_ID_PATTERN = /^[A-Za-z0-9-]{1,128}$/;

function isValidClubId(clubId: unknown): clubId is string {
	return typeof clubId === 'string' && CLUB_ID_PATTERN.test(clubId);
}

export const POST: RequestHandler = async ({ fetch, request, url }) => {
	if (!hasTrustedOrigin(request, url.origin)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	let activeClub: string | null = null;
	try {
		const body = (await request.json().catch(() => ({}))) as { activeClub?: unknown };
		if (typeof body.activeClub !== 'undefined' && body.activeClub !== null) {
			if (!isValidClubId(body.activeClub)) {
				return json({ error: 'Invalid club identifier' }, { status: 400 });
			}
			activeClub = body.activeClub;
		}
	} catch {
		return json({ error: 'Invalid request payload' }, { status: 400 });
	}

	const requestId = makeRequestId();
	const { backendUrl } = serverConfig;
	const backendTicketUrl = new URL('/api/auth/ticket', backendUrl);
	if (activeClub) {
		backendTicketUrl.searchParams.set('active_club', activeClub);
	}

	try {
		const res = await fetch(backendTicketUrl.toString(), {
			method: 'GET',
			headers: {
				cookie: request.headers.get('cookie') || ''
			}
		});

		if (!res.ok) {
			// If backend returns 401/403, we should clear session
			if (res.status === 401 || res.status === 403) {
				return json({ error: 'Unauthorized' }, { status: 401 });
			}
			console.error(`[Auth ticket ${requestId}] backend error`, { status: res.status });
			return json({ error: 'Session refresh failed', requestId }, { status: res.status });
		}

		const data = await res.json();

		const headers = new Headers();
		forwardSetCookieHeaders(res.headers, headers);

		return json(data, { headers });
	} catch (e) {
		console.error(`[Auth ticket ${requestId}] proxy error:`, e);
		return json({ error: 'Internal Server Error', requestId }, { status: 500 });
	}
};

export const GET: RequestHandler = async () =>
	json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'POST' } });
