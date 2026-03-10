// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../nats.svelte', () => ({
	nats: {
		request: vi.fn()
	}
}));

import { TagService } from '../tags.svelte';
import type { TagHistoryResponseRaw } from '../tags.svelte';

function makeRaw(
	guildId: string,
	entries: Array<{
		id: number;
		tag_number: number;
		new_member_id: string;
		old_member_id?: string;
		reason: string;
		created_at: string;
	}>
): TagHistoryResponseRaw {
	return { guild_id: guildId, entries };
}

describe('TagService', () => {
	let service: TagService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new TagService();
	});

	// ── selectedMemberHistory ─────────────────────────────────────────────────

	describe('selectedMemberHistory', () => {
		it('returns empty array when no member is selected', () => {
			expect(service.selectedMemberHistory).toEqual([]);
		});

		it('returns empty array when selected member has no cached history', () => {
			service.selectMember('member-1', 'guild-1');
			expect(service.selectedMemberHistory).toEqual([]);
		});

		it('returns cached entries for selected member sorted by date descending', () => {
			service.selectMember('member-1', 'guild-1');
			service.applyMemberHistoryResponse(
				'guild-1',
				'member-1',
				makeRaw('guild-1', [
					{
						id: 1,
						tag_number: 7,
						new_member_id: 'member-1',
						reason: 'won',
						created_at: '2025-01-01T00:00:00Z'
					},
					{
						id: 2,
						tag_number: 9,
						new_member_id: 'member-1',
						reason: 'challenge',
						created_at: '2025-01-03T00:00:00Z'
					},
					{
						id: 3,
						tag_number: 8,
						new_member_id: 'member-1',
						reason: 'lost',
						created_at: '2025-01-02T00:00:00Z'
					}
				])
			);

			const result = service.selectedMemberHistory;
			expect(result).toHaveLength(3);
			expect(result[0].id).toBe(2); // most recent
			expect(result[1].id).toBe(3);
			expect(result[2].id).toBe(1);
		});

		it('does not return entries from a different member or guild cache slot', () => {
			service.applyMemberHistoryResponse(
				'guild-2',
				'member-2',
				makeRaw('guild-2', [
					{
						id: 99,
						tag_number: 5,
						new_member_id: 'member-2',
						reason: 'won',
						created_at: '2025-01-01T00:00:00Z'
					}
				])
			);
			service.selectMember('member-1', 'guild-1');
			expect(service.selectedMemberHistory).toEqual([]);
		});

		it('keeps the same member separated across guild contexts', () => {
			service.applyMemberHistoryResponse(
				'guild-1',
				'member-1',
				makeRaw('guild-1', [
					{
						id: 1,
						tag_number: 7,
						new_member_id: 'member-1',
						reason: 'won',
						created_at: '2025-01-01T00:00:00Z'
					}
				])
			);
			service.applyMemberHistoryResponse(
				'guild-2',
				'member-1',
				makeRaw('guild-2', [
					{
						id: 2,
						tag_number: 3,
						new_member_id: 'member-1',
						reason: 'challenge',
						created_at: '2025-01-02T00:00:00Z'
					}
				])
			);

			service.selectMember('member-1', 'guild-1');
			expect(service.selectedMemberHistory).toHaveLength(1);
			expect(service.selectedMemberHistory[0].tagNumber).toBe(7);

			service.selectMember('member-1', 'guild-2');
			expect(service.selectedMemberHistory).toHaveLength(1);
			expect(service.selectedMemberHistory[0].tagNumber).toBe(3);
		});

		it('preserves entries from multiple members independently in the cache', () => {
			service.applyMemberHistoryResponse(
				'guild-1',
				'member-1',
				makeRaw('guild-1', [
					{
						id: 1,
						tag_number: 7,
						new_member_id: 'member-1',
						reason: 'won',
						created_at: '2025-01-01T00:00:00Z'
					}
				])
			);
			service.applyMemberHistoryResponse(
				'guild-1',
				'member-2',
				makeRaw('guild-1', [
					{
						id: 2,
						tag_number: 3,
						new_member_id: 'member-2',
						reason: 'challenge',
						created_at: '2025-01-02T00:00:00Z'
					}
				])
			);

			service.selectMember('member-1', 'guild-1');
			expect(service.selectedMemberHistory).toHaveLength(1);
			expect(service.selectedMemberHistory[0].id).toBe(1);

			service.selectMember('member-2', 'guild-1');
			expect(service.selectedMemberHistory).toHaveLength(1);
			expect(service.selectedMemberHistory[0].id).toBe(2);
		});
	});

	// ── historyLoading ────────────────────────────────────────────────────────

	describe('historyLoading', () => {
		it('starts as false', () => {
			expect(service.historyLoading).toBe(false);
		});

		it('applyMemberHistoryResponse sets historyLoading to false', () => {
			service.historyLoading = true;
			service.applyMemberHistoryResponse('guild-1', 'member-1', makeRaw('guild-1', []));
			expect(service.historyLoading).toBe(false);
		});
	});

	// ── fetchTagHistory with memberId ─────────────────────────────────────────

	describe('fetchTagHistory (member-scoped)', () => {
		it('sets historyLoading true while the request is in-flight', async () => {
			const { nats } = await import('../nats.svelte');
			let resolveRequest!: (v: TagHistoryResponseRaw) => void;
			(nats.request as ReturnType<typeof vi.fn>).mockReturnValueOnce(
				new Promise<TagHistoryResponseRaw>((res) => {
					resolveRequest = res;
				})
			);

			const fetchPromise = service.fetchTagHistory('guild-1', 'member-1');
			expect(service.historyLoading).toBe(true);
			expect(service.loading).toBe(false); // guild-wide loading must stay unaffected

			resolveRequest(makeRaw('guild-1', []));
			await fetchPromise;
			expect(service.historyLoading).toBe(false);
		});

		it('stores results in historyCache without overwriting the guild-wide history array', async () => {
			const { nats } = await import('../nats.svelte');

			// Pre-populate guild-wide history
			service.applyHistoryResponse(
				makeRaw('guild-1', [
					{
						id: 99,
						tag_number: 1,
						new_member_id: 'member-X',
						reason: 'challenge',
						created_at: '2025-01-01T00:00:00Z'
					}
				])
			);

			(nats.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				makeRaw('guild-1', [
					{
						id: 1,
						tag_number: 7,
						new_member_id: 'member-1',
						reason: 'won',
						created_at: '2025-01-01T00:00:00Z'
					}
				])
			);

			await service.fetchTagHistory('guild-1', 'member-1');

			// Guild-wide history untouched
			expect(service.history).toHaveLength(1);
			expect(service.history[0].id).toBe(99);

			// Member cache populated
			service.selectMember('member-1', 'guild-1');
			expect(service.selectedMemberHistory).toHaveLength(1);
			expect(service.selectedMemberHistory[0].tagNumber).toBe(7);
		});

		it('does not trigger a second network request if cache already has data for that member in the same guild', async () => {
			const { nats } = await import('../nats.svelte');

			service.applyMemberHistoryResponse(
				'guild-1',
				'member-1',
				makeRaw('guild-1', [
					{
						id: 1,
						tag_number: 7,
						new_member_id: 'member-1',
						reason: 'won',
						created_at: '2025-01-01T00:00:00Z'
					}
				])
			);

			await service.fetchTagHistory('guild-1', 'member-1');
			expect(nats.request as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
		});

		it('re-fetches the same member when the guild changes', async () => {
			const { nats } = await import('../nats.svelte');

			service.applyMemberHistoryResponse(
				'guild-1',
				'member-1',
				makeRaw('guild-1', [
					{
						id: 1,
						tag_number: 7,
						new_member_id: 'member-1',
						reason: 'won',
						created_at: '2025-01-01T00:00:00Z'
					}
				])
			);

			(nats.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				makeRaw('guild-2', [
					{
						id: 2,
						tag_number: 3,
						new_member_id: 'member-1',
						reason: 'challenge',
						created_at: '2025-01-02T00:00:00Z'
					}
				])
			);

			await service.fetchTagHistory('guild-2', 'member-1');

			expect(nats.request as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
				'leaderboard.tag.history.requested.v1.guild-2',
				{ guild_id: 'guild-2', member_id: 'member-1', limit: 100 },
				{ timeout: 5000 }
			);
		});
	});

	// ── fetchTagHistory without memberId (guild-wide) ─────────────────────────

	describe('fetchTagHistory (guild-wide)', () => {
		it('sets loading (not historyLoading) while in-flight', async () => {
			const { nats } = await import('../nats.svelte');
			let resolveRequest!: (v: TagHistoryResponseRaw) => void;
			(nats.request as ReturnType<typeof vi.fn>).mockReturnValueOnce(
				new Promise<TagHistoryResponseRaw>((res) => {
					resolveRequest = res;
				})
			);

			const fetchPromise = service.fetchTagHistory('guild-1');
			expect(service.loading).toBe(true);
			expect(service.historyLoading).toBe(false); // member loading must stay unaffected

			resolveRequest(makeRaw('guild-1', []));
			await fetchPromise;
		});

		it('stores results in history array, not historyCache', async () => {
			const { nats } = await import('../nats.svelte');
			(nats.request as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				makeRaw('guild-1', [
					{
						id: 5,
						tag_number: 3,
						new_member_id: 'member-A',
						reason: 'won',
						created_at: '2025-01-01T00:00:00Z'
					}
				])
			);

			await service.fetchTagHistory('guild-1');

			expect(service.history).toHaveLength(1);
			expect(service.history[0].id).toBe(5);
			// historyCache should remain empty
			service.selectMember('member-A', 'guild-1');
			expect(service.selectedMemberHistory).toEqual([]);
		});
	});

	describe('reset', () => {
		it('clears selection, cache, lists, and loading state', () => {
			service.history = [
				{
					id: 1,
					tagNumber: 4,
					newMemberId: 'member-1',
					reason: 'won',
					createdAt: '2025-01-01T00:00:00Z'
				}
			];
			service.tagList = [{ memberId: 'member-1', currentTag: 4 }];
			service.historyLoading = true;
			service.loading = true;
			service.error = 'bad';
			service.applyMemberHistoryResponse('guild-1', 'member-1', makeRaw('guild-1', []));
			service.selectMember('member-1', 'guild-1');

			service.reset();

			expect(service.history).toEqual([]);
			expect(service.tagList).toEqual([]);
			expect(service.historyLoading).toBe(false);
			expect(service.loading).toBe(false);
			expect(service.error).toBeNull();
			expect(service.selectedMemberId).toBeNull();
			expect(service.selectedMemberGuildId).toBeNull();
			expect(service.selectedMemberHistory).toEqual([]);
		});
	});
});
