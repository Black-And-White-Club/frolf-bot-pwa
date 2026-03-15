import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server';

vi.mock('$lib/server/config', () => ({
	serverConfig: { backendUrl: 'http://backend' }
}));

vi.mock('$lib/server/security', () => ({
	hasTrustedOrigin: () => true
}));

describe('POST /api/betting/bets', () => {
	let mockFetch: ReturnType<typeof vi.fn>;
	const mockUrl = new URL('http://pwa/api/betting/bets');

	const validBody = {
		club_uuid: 'club-1',
		round_id: 'round-1',
		selection_key: 'player-1',
		stake: 50,
		market_type: 'placement_2nd',
		idempotency_key: 'idem-123'
	};

	beforeEach(() => {
		mockFetch = vi.fn();
	});

	function makeRequest(body: unknown): Request {
		return new Request('http://pwa/api/betting/bets', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', origin: 'http://pwa' },
			body: JSON.stringify(body)
		});
	}

	it('forwards market_type to backend', async () => {
		mockFetch.mockResolvedValueOnce({
			status: 200,
			json: async () => ({ id: 1, status: 'accepted' })
		});

		await POST({ fetch: mockFetch, request: makeRequest(validBody), url: mockUrl } as any);

		const [url, init] = mockFetch.mock.calls[0];
		expect(url).toBe('http://backend/api/betting/bets');
		const forwarded = JSON.parse(init.body as string);
		expect(forwarded.market_type).toBe('placement_2nd');
	});

	it('forwards all required fields to backend', async () => {
		mockFetch.mockResolvedValueOnce({
			status: 200,
			json: async () => ({ id: 1, status: 'accepted' })
		});

		await POST({ fetch: mockFetch, request: makeRequest(validBody), url: mockUrl } as any);

		const [, init] = mockFetch.mock.calls[0];
		const forwarded = JSON.parse(init.body as string);
		expect(forwarded.club_uuid).toBe('club-1');
		expect(forwarded.round_id).toBe('round-1');
		expect(forwarded.selection_key).toBe('player-1');
		expect(forwarded.stake).toBe(50);
		expect(forwarded.idempotency_key).toBe('idem-123');
	});

	it('returns 400 when required fields are missing', async () => {
		const res = await POST({
			fetch: mockFetch,
			request: makeRequest({ club_uuid: 'club-1' }),
			url: mockUrl
		} as any);

		expect(res.status).toBe(400);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('proxies backend error status and body', async () => {
		mockFetch.mockResolvedValueOnce({
			status: 422,
			json: async () => ({ error: 'Cannot bet on yourself', code: 'self_bet_prohibited' })
		});

		const res = await POST({
			fetch: mockFetch,
			request: makeRequest(validBody),
			url: mockUrl
		} as any);

		expect(res.status).toBe(422);
		const data = await res.json();
		expect(data.code).toBe('self_bet_prohibited');
	});

	it('works when market_type is omitted (backward compat)', async () => {
		mockFetch.mockResolvedValueOnce({
			status: 200,
			json: async () => ({ id: 2, status: 'accepted' })
		});

		const bodyWithoutMarketType = { ...validBody };
		delete (bodyWithoutMarketType as any).market_type;

		const res = await POST({
			fetch: mockFetch,
			request: makeRequest(bodyWithoutMarketType),
			url: mockUrl
		} as any);

		expect(res.status).toBe(200);
		// market_type not required — backend defaults to round_winner
	});
});
