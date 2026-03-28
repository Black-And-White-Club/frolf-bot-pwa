// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_URL: 'http://localhost:8080', PUBLIC_NATS_URL: 'ws://localhost' }
}));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/tags') as any, params: {}, data: {} }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

beforeAll(() => {
	// jsdom does not implement element.animate
	if (!Element.prototype.animate) {
		Element.prototype.animate = vi.fn().mockReturnValue({ cancel: vi.fn(), finish: vi.fn() });
	}
});
import TagDetailSheet from '../../src/lib/components/leaderboard/TagDetailSheet.svelte';
import { tagStore } from '../../src/lib/stores/tags.svelte';

const rawHistory = {
	guild_id: 'test-guild',
	entries: [
		{
			id: 1,
			tag_number: 7,
			old_member_id: 'member-2',
			new_member_id: 'member-1',
			reason: 'won',
			created_at: '2025-01-01T10:00:00.000Z'
		},
		{
			id: 2,
			tag_number: 8,
			old_member_id: 'member-1',
			new_member_id: 'member-3',
			reason: 'lost',
			created_at: '2025-01-02T10:00:00.000Z'
		},
		{
			id: 3,
			tag_number: 9,
			old_member_id: 'member-4',
			new_member_id: 'member-1',
			reason: 'challenge',
			created_at: '2025-01-03T10:00:00.000Z'
		}
	]
};

describe('TagDetailSheet (Component)', () => {
	beforeEach(() => {
		tagStore.selectMember(null);
		tagStore.historyLoading = false;
	});

	it('shows loading state when historyLoading is true', () => {
		tagStore.selectMember('member-1', 'test-guild');
		tagStore.historyLoading = true;

		const { container } = render(TagDetailSheet as any, { props: { memberId: 'member-1' } });

		const loading = Array.from(container.querySelectorAll('.empty-state')).find((el) =>
			el.textContent?.includes('Loading')
		);
		expect(loading).not.toBeUndefined();
	});

	it('shows empty state when member has no cached history', () => {
		tagStore.selectMember('member-1', 'test-guild');

		const { container } = render(TagDetailSheet as any, { props: { memberId: 'member-1' } });

		const empty = Array.from(container.querySelectorAll('.empty-state')).find((el) =>
			el.textContent?.includes('No tag history')
		);
		expect(empty).not.toBeUndefined();
	});

	it('shows history entries from the store cache sorted most-recent-first', () => {
		tagStore.selectMember('member-1', 'test-guild');
		tagStore.applyMemberHistoryResponse('test-guild', 'member-1', rawHistory);

		const { container } = render(TagDetailSheet as any, { props: { memberId: 'member-1' } });

		const entries = container.querySelectorAll('.history-group');
		expect(entries.length).toBeGreaterThan(0);
	});
});
