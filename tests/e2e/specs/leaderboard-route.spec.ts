import { test, expect } from '../fixtures';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

test.describe('Leaderboard Route', () => {
const subjectId = 'club-123';
const guildId = 'guild-123';

test('renders leaderboard route and supports load-more pagination', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
const entries = Array.from({ length: 55 }, (_, index) => ({
user_id: `user-${index + 1}`,
tag_number: index + 1,
total_points: 1000 - index * 10,
rounds_played: 12
}));
const members = entries.map((entry) => ({
member_id: entry.user_id,
current_tag: entry.tag_number
}));
const profiles = Object.fromEntries(
entries.map((entry, index) => [
entry.user_id,
{
user_id: entry.user_id,
display_name: `Player ${index + 1}`,
avatar_url: `https://cdn.discordapp.com/embed/avatars/${index % 5}.png`
}
])
);

arrangeSnapshot({
subjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({ guild_id: guildId, leaderboard: entries }),
tags: buildTagListSnapshot({ guild_id: guildId, members }),
profiles
});
await arrangeAuth({ path: '/leaderboard', clubUuid: subjectId, guildId, role: 'player' });
await wsConnect();

await expect(page.getByRole('heading', { name: /Leaderboard/i })).toBeVisible();
await expect(page.locator('[data-testid="leaderboard-top-three"]')).toBeVisible();
await expect(page.getByText('Player 55')).toHaveCount(0);
await expect(page.getByRole('button', { name: 'Load More' })).toBeVisible();
await page.getByRole('button', { name: 'Load More' }).click();
await expect(page.getByRole('button', { name: 'Load More' })).toHaveCount(0);
await expect(page.getByText('Player 55')).toBeVisible();
});

test('uses request identity scope for tag history requests when club UUID differs', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsStubRequest,
wsConnect,
wsAssertPublished,
mockNats
}) => {
arrangeSnapshot({
subjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({
guild_id: guildId,
leaderboard: [
{ user_id: 'user-1', tag_number: 2, total_points: 300, rounds_played: 5 },
{ user_id: 'user-2', tag_number: 1, total_points: 100, rounds_played: 2 },
{ user_id: 'user-3', tag_number: 3, total_points: 500, rounds_played: 7 }
]
}),
tags: buildTagListSnapshot({
guild_id: guildId,
members: [
{ member_id: 'user-1', current_tag: 2 },
{ member_id: 'user-2', current_tag: 1 },
{ member_id: 'user-3', current_tag: 3 }
]
}),
profiles: {
'user-1': {
user_id: 'user-1',
display_name: 'Player 1',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
},
'user-2': {
user_id: 'user-2',
display_name: 'Player 2',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
},
'user-3': {
user_id: 'user-3',
display_name: 'Player 3',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/2.png'
}
}
});
await arrangeAuth({ path: '/leaderboard', clubUuid: subjectId, guildId, role: 'player' });
wsStubRequest(`leaderboard.tag.history.requested.v1.${subjectId}`, {
guild_id: guildId,
entries: [
{
id: 1,
tag_number: 7,
old_member_id: 'user-2',
new_member_id: 'user-1',
reason: 'round_swap',
created_at: '2026-03-01T10:00:00Z'
},
{
id: 2,
tag_number: 5,
old_member_id: 'user-3',
new_member_id: 'user-1',
reason: 'round_swap',
created_at: '2026-03-08T10:00:00Z'
}
]
});
await wsConnect();

await expect(
page.locator('[data-testid="leaderboard-top-three"]').locator(':nth-child(1)')
).toContainText('Player 2');
await page.getByRole('tab', { name: 'Points' }).click();
await expect(
page.locator('[data-testid="leaderboard-top-three"]').locator(':nth-child(1)')
).toContainText('Player 3');

await page.locator('[data-testid="leaderboard-row-user-1"]').click();

const entries = wsAssertPublished(`leaderboard.tag.history.requested.v1.${subjectId}`);
const lastEntry = entries[entries.length - 1];
expect(lastEntry.payload).toEqual({
guild_id: guildId,
club_uuid: subjectId,
member_id: 'user-1',
limit: 100
});

const clubScopedMessages = mockNats
.getPublishedMessages()
.filter((entry) => entry.subject === `leaderboard.tag.history.requested.v1.${guildId}`);
expect(clubScopedMessages).toHaveLength(0);

await expect(page.locator('.history-group')).toHaveCount(2);
await expect(page.locator('.entry-tag').filter({ hasText: '#5' })).toBeVisible();
});
});
