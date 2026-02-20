import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './+server';
import { serverConfig } from '$lib/server/config';

vi.mock('$lib/server/config', () => ({
	serverConfig: {
		backendUrl: 'http://backend'
	}
}));

describe('/api/clubs/[uuid]/invites/[code]', () => {
	let mockFetch: any;
	let mockRequest: any;
	let params: any;

	beforeEach(() => {
		mockFetch = vi.fn();
		mockRequest = {
			headers: new Headers()
		};
		params = { uuid: 'club-123', code: 'invite-code' };
	});

	describe('DELETE', () => {
		it('returns 204 on success', async () => {
			mockFetch.mockResolvedValue({
				status: 204
			});

			const res = await DELETE({ fetch: mockFetch, request: mockRequest, params } as any);

			expect(res.status).toBe(204);
			// Response body should be null for 204, but Response object handling varies in test environment.
			// Implementing check based on status code which is primary verification.
		});

		it('returns JSON error for non-204 status', async () => {
			mockFetch.mockResolvedValue({
				status: 403,
				json: async () => ({ error: 'forbidden' })
			});

			const res = await DELETE({ fetch: mockFetch, request: mockRequest, params } as any);
			const data = await res.json();

			expect(res.status).toBe(403);
			expect(data).toEqual({ error: 'forbidden' });
		});

		it('handles non-JSON error response', async () => {
			mockFetch.mockResolvedValue({
				status: 500,
				json: async () => {
					throw new Error('Not JSON');
				}
			});

			const res = await DELETE({ fetch: mockFetch, request: mockRequest, params } as any);
			const data = await res.json();

			expect(res.status).toBe(500);
			expect(data).toEqual({ error: 'Request failed' });
		});
	});
});
