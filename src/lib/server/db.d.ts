declare module '$lib/server/db' {
	// Minimal query builder types to represent the small subset used in auth.ts
	export type AnyRow = Record<string, unknown>;

	export interface QueryBuilder<T = AnyRow> {
		from(table: unknown): QueryBuilder<T>;
		innerJoin(table: unknown, cond: unknown): QueryBuilder<T>;
		where(cond: unknown): Promise<T[]>;
	}

	export interface UpdateBuilder {
		set(obj: Partial<Record<string, unknown>>): { where(cond: unknown): Promise<unknown> };
		where?(cond: unknown): Promise<unknown>;
	}

	export interface DeleteBuilder {
		where(cond: unknown): Promise<unknown>;
	}

	export interface DB {
		insert(table: unknown): { values(v: unknown): Promise<unknown> };
		select<T = AnyRow>(cols: unknown): QueryBuilder<T>;
		update(table: unknown): UpdateBuilder;
		delete(table: unknown): DeleteBuilder;
	}

	export const db: DB;
}

export {};
