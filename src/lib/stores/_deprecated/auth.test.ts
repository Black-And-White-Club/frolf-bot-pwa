// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
// tests for auth store

describe('auth store', () => {
	beforeEach(() => {
		// reset mock module by re-importing
		vi.resetModules();
	});

	it('login uses mockAuth.login and sets the store', async () => {
		const auth = await import('$lib/stores/auth');
		const res = await auth.login();
		expect(res).not.toBeNull();
		expect(res).toHaveProperty('token');
	});

	it('getSession returns existing or fetched session', async () => {
		const auth = await import('$lib/stores/auth');
		// ensure cached behavior: after login, getSession should return same session
		const loggedIn = await auth.login();
		const s1 = await auth.getSession();
		expect(s1).toEqual(loggedIn);
	});
});
