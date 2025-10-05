declare module '$lib/paraglide/runtime' {
	/**
	 * Low-level de-localization: returns an absolute URL with locale prefix removed when applicable.
	 */
	export function deLocalizeUrl(url: string | URL): URL;
}

export {};
