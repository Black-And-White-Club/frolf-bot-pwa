import { test, expect } from '../fixtures';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Tags Route', () => {
const subjectId = 'guild-123';

test('renders tag leaderboard and tag history sheet interactions', async ({
page,
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect
}) => {
arrangeSnapshot({
subjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({
guild_id: subjectId,
leaderboard: [
{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 }
]
}),
tags: buildTagListSnapshot({
guild_id: subjectId,
members: [
{ member_id: 'user-1', current_tag: 1 },
{ member_id: 'user-2', current_tag: 2 }
]
}),
profiles: {
'user-1': {
user_id: 'user-1',
display_name: 'Player One',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
},
'user-2': {
user_id: 'user-2',
display_name: 'Player Two',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
}
}
});
await arrangeAuth({ path: '/tags', clubUuid: subjectId, guildId: subjectId, role: 'player' });
wsStubRequest(`leaderboard.tag.history.requested.v1.${subjectId}`, {
guild_id: subjectId,
entries: []
});
await wsConnect();

await expectDashboardLoaded(page);
await expect(page.getByText('Tag Leaderboard')).toBeVisible();
await page.locator('[aria-label^="Select "]').first().click();
await expect(page.locator('.tag-detail-inline')).toBeVisible();
await expect(page.getByText('No tag history available.')).toBeVisible();
});
});
