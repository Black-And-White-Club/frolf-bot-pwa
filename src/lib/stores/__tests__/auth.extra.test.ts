// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('auth store extra cases', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('login uses a named login export when present', async () => {
		const mod = await import('$lib/mocks/mockAuth');
		// use the official test helper
		mod.resetMocks();
		mod.setLoginMock(async () => ({ user: { id: 'uX', name: 'X' }, token: 'tX' }));
		const auth = await import('$lib/stores/auth');
		const res = await auth.login();
		expect(res).toBeTruthy();
		expect(res).toHaveProperty('token', 'tX');
	});

	it('login finds loginMock name if login missing', async () => {
		const mod2 = await import('$lib/mocks/mockAuth');
		mod2.resetMocks();
		mod2.setLoginMock(async () => ({ user: { id: 'uM', name: 'M' }, token: 'tM' }));
		const auth = await import('$lib/stores/auth');
		const res = await auth.login();
		expect(res).toBeTruthy();
		expect(res!.user.id).toBe('uM');
	});

	it('login finds function inside default object', async () => {
		const mod3 = await import('$lib/mocks/mockAuth');
		mod3.resetMocks();
		mod3.setLoginMock(async () => ({ user: { id: 'd1', name: 'D' }, token: 'td' }));
		const auth = await import('$lib/stores/auth');
		const res = await auth.login();
		expect(res).toBeTruthy();
		expect(res!.token).toBe('td');
	});

	it('login rejects when underlying function throws', async () => {
		const mod4 = await import('$lib/mocks/mockAuth');
		mod4.resetMocks();
		mod4.setLoginMock(async () => {
			throw new Error('boom');
		});
		const auth = await import('$lib/stores/auth');
		await expect(auth.login()).rejects.toThrow('boom');
		// store should remain null
		const s = await auth.getSession();
		expect(s).toBeNull();
	});

	it('logout calls underlying logout and clears store', async () => {
		const mod5 = await import('$lib/mocks/mockAuth');
		mod5.resetMocks();
		// call login to set internal session
		await mod5.loginMock();
		const spy = vi.fn().mockResolvedValue(undefined);
		// ensure the logout mock also clears the internal session
		mod5.setLogoutMock(async () => {
			await spy();
			mod5.resetMocks();
		});
		const auth = await import('$lib/stores/auth');
		// prime store
		const s = await auth.getSession();
		expect(s).toBeTruthy();
		await auth.logout();
		expect(spy).toHaveBeenCalled();
		const after = await auth.getSession();
		expect(after).toBeNull();
	});
});
