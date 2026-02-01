declare module 'vitest-browser-svelte' {
	/** Render a Svelte component in a browser-like environment for tests */
	export function render(component: unknown, options?: unknown): unknown;
	/** Cleanup rendered components between tests */
	export function cleanup(): void;
}

export {};
