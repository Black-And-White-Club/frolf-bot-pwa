// Paraglide runtime is implemented in JS; declarations exist in .d.ts files

// Accept a variety of request shapes used across server/client helpers
// - Request (web Request)
// - URL
// - string (absolute or relative URL)
// - object with a `url: string` property (framework-specific event)
export const reroute = (request: Request | URL | string | { url: string }): string => {
	const urlStr =
		typeof request === 'string'
			? request
			: request instanceof URL
				? request.href
				: 'url' in request
					? request.url
					: (request as Request).url;

	try {
		const url = new URL(urlStr, 'http://localhost');
		return url.pathname;
	} catch {
		return urlStr;
	}
};
