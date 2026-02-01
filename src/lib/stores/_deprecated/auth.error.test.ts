import { beforeEach, describe, expect, it } from 'vitest';

describe('auth store - error and edge paths', () => {
	beforeEach(async () => {
		// reset real AuthStore if available by importing and clearing
		const auth = await import('$lib/stores/auth');
		try {
			auth.default.set(null);
		} catch {
			// ignore when not present
		}
	});

	it('handles backend returning success=false (no session)', async () => {
		// Use real mock helpers to override login behavior
		const mockAuth = await import('$lib/mocks/mockAuth');
		mockAuth.setLoginMock(() => Promise.resolve(null));

		const auth = await import('$lib/stores/auth');
		const s = await auth.login();
		expect(s).toBeNull();

		mockAuth.resetMocks();
	});

	it('handles remote login throwing (network error)', async () => {
		const mockAuth = await import('$lib/mocks/mockAuth');
		mockAuth.setLoginMock(() => Promise.reject(new Error('network')));

		const auth = await import('$lib/stores/auth');
		// implementation currently propagates thrown errors from the login function
		await expect(auth.login()).rejects.toThrow(/network/);

		mockAuth.resetMocks();
	});
});
