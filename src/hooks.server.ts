import type { Handle } from '@sveltejs/kit';

// Minimal security headers and CSP suitable for this app. Adjust as needed for
// external integrations (analytics, CDNs, etc.). This runs for every request
// and sets common security headers Lighthouse wants to see.
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Conservative CSP - allow self, same-origin for most resources. If you add
	// inline scripts/styles or external analytics, update this accordingly.
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: https://images.unsplash.com https://*.githubusercontent.com https://cdn.discordapp.com",
		"font-src 'self' data:",
		"manifest-src 'self'",
		"connect-src 'self' https://api.github.com ws:",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"object-src 'none'"
	].join('; ');

	response.headers.set('Content-Security-Policy', csp);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
	response.headers.set('X-XSS-Protection', '0');

	return response;
};
