// @ts-expect-error TS7016: runtime is implemented in JS; declarations exist in .d.ts files
import { deLocalizeUrl } from './lib/paraglide/runtime';

// Accept a variety of request shapes used across server/client helpers
// - Request (web Request)
// - URL
// - string (absolute or relative URL)
// - object with a `url: string` property (framework-specific event)
export const reroute = (request: Request | URL | string | { url: string }): string => {
	const input: string | URL =
		typeof request === 'string'
			? request
			: request instanceof URL
				? request
				: 'url' in request
					? request.url
					: (request as Request).url;

	return deLocalizeUrl(input).pathname;
};
