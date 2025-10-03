// Consolidated ambient declarations to quiet svelte-check and TypeScript for
// local runtime modules and dev/test-only packages used in the PWA.
// Add or tighten types here as you replace shims with real typings.

declare module '$lib/paraglide/runtime' {
  export function deLocalizeUrl(url: string | URL): { pathname: string };
}

declare module 'drizzle-orm' {
  // minimal shape used by server code; replace with real types as needed
  export function eq<T = unknown>(a: T, b: T): boolean;
  export type SQL = unknown;
}

declare module '$lib/server/db' {
  export const db: {
    insert?: (t: unknown) => { values: (v: unknown) => Promise<unknown> };
    select?: (...args: unknown[]) => Promise<unknown>;
    update?: (...args: unknown[]) => Promise<unknown>;
    delete?: (...args: unknown[]) => Promise<unknown>;
  };
}

declare module '$lib/server/db/schema' {
  export const user: { id: unknown; username: unknown };
  export const session: { id: unknown; userId: unknown; expiresAt: Date };
  export type Session = { id: string; userId: string; expiresAt: Date };
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
  import type { SvelteComponentTyped } from 'svelte';
  const component: SvelteComponentTyped<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;
  export default component;
}

export {};
