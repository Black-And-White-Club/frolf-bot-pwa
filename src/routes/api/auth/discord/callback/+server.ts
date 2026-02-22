import type { RequestHandler } from '@sveltejs/kit';
import { serverConfig } from '$lib/server/config';
import { forwardSetCookieHeaders } from '$lib/server/http';

const OAUTH_RETURN_TO_COOKIE = 'oauth_return_to';

function parseCookieValue(cookieHeader: string, name: string): string | null {
	if (!cookieHeader) return null;
	for (const part of cookieHeader.split(';')) {
		const cookie = part.trim();
		if (!cookie) continue;
		const separator = cookie.indexOf('=');
		const key = separator === -1 ? cookie : cookie.slice(0, separator);
		if (key === name) {
			return separator === -1 ? '' : cookie.slice(separator + 1);
		}
	}
	return null;
}

function sanitizeRedirect(raw: string | null): string | null {
	if (!raw) return null;
	const candidate = raw.trim();
	if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return null;

	try {
		const parsed = new URL(candidate, 'http://local');
		if (parsed.origin !== 'http://local') return null;
		return `${parsed.pathname}${parsed.search}`;
	} catch {
		return null;
	}
}

function buildOAuthFailedLocation(url: URL, cookieHeader: string): string {
	const queryRedirect = sanitizeRedirect(url.searchParams.get('redirect'));

	let cookieRedirect: string | null = null;
	const rawCookie = parseCookieValue(cookieHeader, OAUTH_RETURN_TO_COOKIE);
	if (rawCookie) {
		try {
			cookieRedirect = sanitizeRedirect(decodeURIComponent(rawCookie.replace(/\+/g, '%20')));
		} catch {
			cookieRedirect = null;
		}
	}

	const redirect = queryRedirect ?? cookieRedirect;
	const params = new URLSearchParams({ error: 'oauth_failed' });
	if (redirect) {
		params.set('redirect', redirect);
	}

	return `/auth/signin?${params.toString()}`;
}

/**
 * Proxy the Discord OAuth callback to the backend.
 * The browser arrives here after Discord redirects back with `code` and `state`.
 * We forward the query params and the oauth_state cookie to the backend.
 * The backend validates the CSRF state, exchanges the code, sets the
 * refresh_token cookie, and redirects to the PWA base URL.
 * We forward Set-Cookie headers and preserve redirect intent on failure.
 */
export const GET: RequestHandler = async ({ fetch, request, url }) => {
	const backendUrl = new URL('/api/auth/discord/callback', serverConfig.backendUrl);
	url.searchParams.forEach((value, key) => {
		backendUrl.searchParams.set(key, value);
	});
	const cookieHeader = request.headers.get('cookie') || '';

	const res = await fetch(backendUrl.toString(), {
		redirect: 'manual',
		headers: {
			cookie: cookieHeader
		}
	});

	const headers = new Headers();
	forwardSetCookieHeaders(res.headers, headers);

	if (res.status >= 400) {
		headers.set('Location', buildOAuthFailedLocation(url, cookieHeader));
		return new Response(null, { status: 302, headers });
	}

	const backendLoc = res.headers.get('location');
	let redirectPath = '/';
	if (backendLoc) {
		try {
			const u = new URL(backendLoc, url.origin);
			redirectPath = u.pathname + u.search;
		} catch {
			/* keep default '/' */
		}
	}
	headers.set('Location', redirectPath);
	return new Response(null, { status: 302, headers });
};
