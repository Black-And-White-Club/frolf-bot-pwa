// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$lib/config', () => ({
	config: { api: { url: 'http://localhost:8080' } }
}));

const ok = (data: object) => ({ ok: true, status: 200, json: async () => data });
const fail = (status: number) => ({ ok: false, status });

describe('ActivityAuth', () => {
	let activityAuth: any;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.useFakeTimers();
		vi.resetModules();
		fetchMock = vi.fn();
		global.fetch = fetchMock as unknown as typeof fetch;
		const mod = await import('../activity-auth.svelte');
		activityAuth = mod.activityAuth;
		activityAuth.reset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('initializes with idle status', () => {
		expect(activityAuth.status).toBe('idle');
		expect(activityAuth.isAuthenticated).toBe(false);
		expect(activityAuth.refreshToken).toBeNull();
	});

	describe('authenticate', () => {
		it('sets authenticated state on success', async () => {
			fetchMock.mockResolvedValueOnce(
				ok({ refresh_token: 'rt-abc', ticket: 'nats-jwt', user_uuid: 'user-123' })
			);

			await activityAuth.authenticate('discord-code-xyz');

			expect(activityAuth.status).toBe('authenticated');
			expect(activityAuth.isAuthenticated).toBe(true);
			expect(activityAuth.refreshToken).toBe('rt-abc');
			expect(activityAuth.ticket).toBe('nats-jwt');
			expect(activityAuth.userUUID).toBe('user-123');
		});

		it('posts to the token-exchange endpoint', async () => {
			fetchMock.mockResolvedValueOnce(ok({ refresh_token: 'rt', ticket: 't', user_uuid: 'u' }));

			await activityAuth.authenticate('my-code');

			const [url, opts] = fetchMock.mock.calls[0];
			expect(url).toContain('/api/auth/discord-activity/token-exchange');
			expect(JSON.parse(opts.body)).toEqual({ code: 'my-code' });
		});

		it('sets error status after all retries exhaust on non-ok response', async () => {
			// 401 is non-retryable (OAuth codes are one-time-use), so only 1 call is made.
			// 429/5xx are retryable; this test specifically covers the 401 bail-out path.
			fetchMock.mockResolvedValue(fail(401));

			const promise = activityAuth.authenticate('bad-code');
			await vi.runAllTimersAsync();
			await promise;

			expect(activityAuth.status).toBe('error');
			expect(activityAuth.error).toMatch(/401/);
			expect(activityAuth.isAuthenticated).toBe(false);
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		it('sets error status after all retries exhaust on network failure', async () => {
			fetchMock.mockRejectedValue(new Error('Network unreachable'));

			const promise = activityAuth.authenticate('any-code');
			await vi.runAllTimersAsync();
			await promise;

			expect(activityAuth.status).toBe('error');
			expect(activityAuth.error).toBe('Network unreachable');
			expect(fetchMock).toHaveBeenCalledTimes(4);
		});

		it('retries on 429 and succeeds when a later attempt returns 200', async () => {
			fetchMock
				.mockResolvedValueOnce(fail(429))
				.mockResolvedValueOnce(fail(429))
				.mockResolvedValueOnce(ok({ refresh_token: 'rt', ticket: 'tk', user_uuid: 'u' }));

			const promise = activityAuth.authenticate('code');
			await vi.runAllTimersAsync();
			await promise;

			expect(activityAuth.status).toBe('authenticated');
			expect(fetchMock).toHaveBeenCalledTimes(3);
		});

		it('retries on network error and succeeds on retry', async () => {
			fetchMock
				.mockRejectedValueOnce(new Error('Transient error'))
				.mockResolvedValueOnce(ok({ refresh_token: 'rt', ticket: 'tk', user_uuid: 'u' }));

			const promise = activityAuth.authenticate('code');
			await vi.runAllTimersAsync();
			await promise;

			expect(activityAuth.status).toBe('authenticated');
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it('uses exponential backoff delays (1s, 2s, 4s)', async () => {
			fetchMock.mockRejectedValue(new Error('fail'));

			const promise = activityAuth.authenticate('code');

			// After attempt 0 fails, should delay 1000ms before attempt 1
			await vi.advanceTimersByTimeAsync(999);
			expect(fetchMock).toHaveBeenCalledTimes(1);
			await vi.advanceTimersByTimeAsync(1);
			expect(fetchMock).toHaveBeenCalledTimes(2);

			// After attempt 1 fails, should delay 2000ms before attempt 2
			await vi.advanceTimersByTimeAsync(1999);
			expect(fetchMock).toHaveBeenCalledTimes(2);
			await vi.advanceTimersByTimeAsync(1);
			expect(fetchMock).toHaveBeenCalledTimes(3);

			// After attempt 2 fails, should delay 4000ms before attempt 3
			await vi.advanceTimersByTimeAsync(3999);
			expect(fetchMock).toHaveBeenCalledTimes(3);
			await vi.advanceTimersByTimeAsync(1);
			expect(fetchMock).toHaveBeenCalledTimes(4);

			await promise;
		});

		it('clears error state at the start of each authenticate call', async () => {
			fetchMock.mockRejectedValue(new Error('fail'));
			const p1 = activityAuth.authenticate('code');
			await vi.runAllTimersAsync();
			await p1;
			expect(activityAuth.error).not.toBeNull();

			fetchMock.mockResolvedValueOnce(ok({ refresh_token: 'rt', ticket: 'tk', user_uuid: 'u' }));
			const p2 = activityAuth.authenticate('code');
			await vi.runAllTimersAsync();
			await p2;

			expect(activityAuth.error).toBeNull();
			expect(activityAuth.status).toBe('authenticated');
		});
	});

	describe('refreshSession', () => {
		it('returns null when no refreshToken', async () => {
			const result = await activityAuth.refreshSession();
			expect(result).toBeNull();
		});

		it('updates ticket and returns it on success', async () => {
			activityAuth.refreshToken = 'rt-original';
			fetchMock.mockResolvedValueOnce(ok({ ticket: 'new-ticket', refresh_token: 'rt-rotated' }));

			const ticket = await activityAuth.refreshSession();

			expect(ticket).toBe('new-ticket');
			expect(activityAuth.ticket).toBe('new-ticket');
			expect(activityAuth.refreshToken).toBe('rt-rotated');
		});

		it('sets error status on non-ok response and returns null', async () => {
			activityAuth.refreshToken = 'rt-expired';
			fetchMock.mockResolvedValueOnce(fail(401));

			const result = await activityAuth.refreshSession();

			expect(result).toBeNull();
			expect(activityAuth.status).toBe('error');
		});
	});

	describe('authHeader', () => {
		it('returns Authorization header when refreshToken is set', () => {
			activityAuth.refreshToken = 'my-token';
			expect(activityAuth.authHeader).toEqual({ Authorization: 'Bearer my-token' });
		});

		it('returns empty object when no refreshToken', () => {
			activityAuth.refreshToken = null;
			expect(activityAuth.authHeader).toEqual({});
		});
	});

	describe('reset', () => {
		it('clears all state', async () => {
			fetchMock.mockResolvedValueOnce(ok({ refresh_token: 'rt', ticket: 't', user_uuid: 'u' }));
			await activityAuth.authenticate('code');
			activityAuth.reset();

			expect(activityAuth.status).toBe('idle');
			expect(activityAuth.refreshToken).toBeNull();
			expect(activityAuth.ticket).toBeNull();
			expect(activityAuth.userUUID).toBeNull();
			expect(activityAuth.error).toBeNull();
		});
	});
});
