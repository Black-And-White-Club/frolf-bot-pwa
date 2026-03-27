// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
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

const loading = container.querySelector('[data-testid="tag-history-loading"]');
expect(loading).not.toBeNull();
});

it('shows empty state when member has no cached history', () => {
tagStore.selectMember('member-1', 'test-guild');

const { container } = render(TagDetailSheet as any, { props: { memberId: 'member-1' } });

const empty = container.querySelector('[data-testid="tag-history-empty"]');
expect(empty).not.toBeNull();
});

it('shows history entries from the store cache sorted most-recent-first', () => {
tagStore.selectMember('member-1', 'test-guild');
tagStore.applyMemberHistoryResponse('test-guild', 'member-1', rawHistory);

const { container } = render(TagDetailSheet as any, { props: { memberId: 'member-1' } });

const entries = container.querySelectorAll('[data-testid="tag-history-entry"]');
expect(entries.length).toBe(3);
});
});
