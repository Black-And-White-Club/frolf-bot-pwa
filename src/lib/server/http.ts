function splitSetCookieHeader(value: string): string[] {
	// Split on comma boundaries that look like the start of the next cookie.
	return value
		.split(/,(?=\s*[^;=,\s]+=[^;]+)/g)
		.map((cookie) => cookie.trim())
		.filter(Boolean);
}

export function forwardSetCookieHeaders(source: Headers, destination: Headers): void {
	const getSetCookie = (source as Headers & { getSetCookie?: () => string[] }).getSetCookie;
	if (typeof getSetCookie === 'function') {
		for (const cookie of getSetCookie.call(source)) {
			destination.append('set-cookie', cookie);
		}
		return;
	}

	const setCookie = source.get('set-cookie');
	if (!setCookie) return;

	for (const cookie of splitSetCookieHeader(setCookie)) {
		destination.append('set-cookie', cookie);
	}
}
