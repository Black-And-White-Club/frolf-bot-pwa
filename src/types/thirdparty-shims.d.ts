declare module 'vitest-browser-svelte' {
	export function render(component: unknown, options?: unknown): unknown;
	export function cleanup(): void;
}

export {};
