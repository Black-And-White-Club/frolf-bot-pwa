declare module '$lib/server/db/schema' {
	export const user: { id: unknown; username: unknown };
	export const session: { id: unknown; userId: unknown; expiresAt: Date };
	export type Session = { id: string; userId: string; expiresAt: Date };
}

export {};
