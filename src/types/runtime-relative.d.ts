// Provide a module declaration for the relative import path used in `src/hooks.ts`.
// This is a minimal typed surface for the runtime implementation (keeps runtime.js as JS).
declare module './lib/paraglide/runtime' {
	/** De-localizes a URL and returns an absolute URL */
	export function deLocalizeUrl(url: string | URL): URL;
}

export {};
