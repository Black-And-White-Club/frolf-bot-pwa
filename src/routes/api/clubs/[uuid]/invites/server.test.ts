import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './+server';
import { serverConfig } from '$lib/server/config';

vi.mock('$lib/server/config', () => ({
	serverConfig: {
		backendUrl: 'http://backend'
	}
}));

describe('/api/clubs/[uuid]/invites', () => {
	let mockFetch: any;
	let mockRequest: any;
	let params: any;

	beforeEach(() => {
		mockFetch = vi.fn();
		mockRequest = {
			headers: new Headers(),
			json: vi.fn()
		};
		params = { uuid: 'club-123' };
	});

	describe('GET', () => {
		it('returns list of invites on success', async () => {
			const mockData = [{ code: 'abc' }];
			mockFetch.mockResolvedValue({
				status: 200,
				json: async () => mockData
			});

			const res = await GET({ fetch: mockFetch, request: mockRequest, params } as any);
			const data = await res.json();

			expect(res.status).toBe(200);
			expect(data).toEqual(mockData);
			expect(mockFetch).toHaveBeenCalledWith(
				'http://backend/api/clubs/club-123/invites',
				expect.anything()
			);
		});

		it('handles non-JSON error response from backend', async () => {
			mockFetch.mockResolvedValue({
				status: 500,
				json: async () => { throw new Error('Not JSON'); }
			});

			const res = await GET({ fetch: mockFetch, request: mockRequest, params } as any);
			const data = await res.json();

			expect(res.status).toBe(500);
			expect(data).toEqual({ error: 'Request failed' });
		});
	});

	describe('POST', () => {
		it('creates new invite on success', async () => {
			const mockBody = { some: 'data' };
			const mockResponse = { code: 'new-code' };
			mockRequest.json.mockResolvedValue(mockBody);
			mockFetch.mockResolvedValue({
				status: 201,
				json: async () => mockResponse
			});

			const res = await POST({ fetch: mockFetch, request: mockRequest, params } as any);
			const data = await res.json();

			expect(res.status).toBe(201);
			expect(data).toEqual(mockResponse);
			expect(mockFetch).toHaveBeenCalledWith(
				'http://backend/api/clubs/club-123/invites',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(mockBody)
				})
			);
		});

		it('handles request body error', async () => {
			mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));
			mockFetch.mockResolvedValue({
				status: 400,
				json: async () => ({})
			});

			await POST({ fetch: mockFetch, request: mockRequest, params } as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					body: 'null' 
				})
			);
		});
	});
});
