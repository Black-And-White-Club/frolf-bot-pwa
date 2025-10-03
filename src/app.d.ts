import type { SvelteComponentTyped } from 'svelte';

// Project-level ambient declarations to help svelte-check find types for
// local runtime modules and dev-only packages used in tests.

declare module '$lib/paraglide/runtime' {
    export function deLocalizeUrl(url: string | URL): { pathname: string };
}

declare module 'drizzle-orm' {
    export function eq(a: unknown, b: unknown): unknown;
}

declare module '$lib/server/db' {
    export const db: unknown;
}

declare module '$lib/server/db/schema' {
    export const user: unknown;
    export const session: unknown;
    export type Session = unknown;
}

declare module 'vitest-browser-svelte' {
    export function render(component: unknown, options?: unknown): unknown;
    export function cleanup(): void;
}

declare module '@oslojs/crypto/sha2' {
    export function sha256(data: Uint8Array): Uint8Array;
}

declare module '@oslojs/encoding' {
    export function encodeBase64url(bytes: Uint8Array): string;
    export function encodeHexLowerCase(bytes: Uint8Array): string;
}

declare module '*.svelte' {
    // Generic Svelte component type to satisfy imports in TypeScript tooling
    const component: SvelteComponentTyped<unknown, unknown, unknown>;
    export default component;
}

export {};
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			auth: import('@auth/sveltekit').Session | null;
		}
	} // interface Error {}
	// interface Locals {}
} // interface PageData {}
// interface PageState {}

// interface Platform {}
export {};
