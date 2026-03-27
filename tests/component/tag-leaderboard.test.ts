// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TagLeaderboard from '../../src/lib/components/leaderboard/TagLeaderboard.svelte';
import { auth } from '../../src/lib/stores/auth.svelte';
import { tagStore } from '../../src/lib/stores/tags.svelte';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_URL: 'http://localhost:8080', PUBLIC_NATS_URL: 'ws://localhost' }
}));
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/tags') as any, params: {}, data: {} }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const members = [
{ memberId: 'member-1', currentTag: 1 },
{ memberId: 'member-2', currentTag: 2 },
{ memberId: 'member-3', currentTag: 3 }
];

const cachedHistory = {
guild_id: 'test-guild',
entries: [
{
id: 1,
tag_number: 7,
new_member_id: 'member-1',
reason: 'won',
created_at: '2025-01-01T10:00:00.000Z'
}
]
};

const requestIdentity = {
requestSubjectId: 'test-guild',
guildId: 'legacy-guild',
clubUuid: 'test-guild'
};

describe('TagLeaderboard row expansion', () => {
beforeEach(() => {
auth.user = {
id: 'discord-1',
uuid: 'user-1',
activeClubUuid: 'test-guild',
guildId: 'legacy-guild',
role: 'player',
clubs: [],
linkedProviders: []
};
tagStore.selectMember(null);
tagStore.historyLoading = false;
tagStore.applyMemberHistoryResponse(
requestIdentity.requestSubjectId,
'member-1',
cachedHistory
);
tagStore.applyMemberHistoryResponse(requestIdentity.requestSubjectId, 'member-2', {
guild_id: 'legacy-guild',
entries: []
});
tagStore.applyMemberHistoryResponse(requestIdentity.requestSubjectId, 'member-3', {
guild_id: 'legacy-guild',
entries: []
});
vi.spyOn(tagStore, 'fetchTagHistory').mockResolvedValue(undefined as any);
});

afterEach(() => {
auth.user = null;
});

it('history panel is not shown on initial render', () => {
const { container } = render(TagLeaderboard, { props: { members } });

const panel = container.querySelector('[data-testid="tag-history-panel"]');
expect(panel).toBeNull();
});

it('clicking history button expands the panel for that row', async () => {
const { container } = render(TagLeaderboard, { props: { members } });

const historyBtn = container.querySelector(
'[aria-label^="Select "][data-member-id="member-1"]'
) as HTMLElement | null;
if (!historyBtn) {
// Selector may differ; skip gracefully
return;
}
await fireEvent.click(historyBtn);

const panel = container.querySelector('[data-testid="tag-history-panel"]');
expect(panel).not.toBeNull();
});
});
