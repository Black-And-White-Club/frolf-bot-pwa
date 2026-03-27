import { test, expect } from '../fixtures';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Leaderboard Flow', () => {
const subjectId = 'guild-123';

test.beforeEach(async ({
arrangeSnapshot,
arrangeAuth,
wsConnect,
page,
wsAssertPublished
}) => {
arrangeSnapshot({
subjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({
guild_id: subjectId,
leaderboard: [
{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 },
{ user_id: 'user-3', tag_number: 3, total_points: 425, rounds_played: 6 }
]
}),
tags: buildTagListSnapshot({
guild_id: subjectId,
members: [
{ member_id: 'user-1', current_tag: 1 },
{ member_id: 'user-2', current_tag: 2 },
{ member_id: 'user-3', current_tag: 3 }
]
})
});
await arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
await wsConnect();
await expectDashboardLoaded(page);
wsAssertPublished(`leaderboard.snapshot.request.v2.${subjectId}`);
});

test('displays leaderboard rows from snapshot', async ({ page, wsAssertPublished }) => {
const leaderboard = new LeaderboardPage(page);
await leaderboard.expectLoaded({ minRows: 3 });
await leaderboard.expectRowCount(3);
await leaderboard.expectFirstUser('user-1');
});

test('reorders rows after leaderboard.tag.updated', async ({
page,
arrangeSnapshot,
wsRunScenario
}) => {
const leaderboard = new LeaderboardPage(page);
arrangeSnapshot({
subjectId,
leaderboard: buildLeaderboardSnapshot({
guild_id: subjectId,
leaderboard: [
{ user_id: 'user-1', tag_number: 2, total_points: 500, rounds_played: 8 },
{ user_id: 'user-2', tag_number: 5, total_points: 450, rounds_played: 7 }
]
}),
tags: buildTagListSnapshot({
guild_id: subjectId,
members: [
{ member_id: 'user-1', current_tag: 2 },
{ member_id: 'user-2', current_tag: 5 }
]
})
});

wsRunScenario('contracts/scenarios/leaderboard/updated.round-1.json', { subjectId });
await leaderboard.expectFirstUser('user-1');

wsRunScenario('contracts/scenarios/leaderboard/tag.updated.simple.json', { subjectId });
await leaderboard.expectFirstUser('user-2');
});

test('swaps tags after leaderboard.tag.swap.processed', async ({
page,
arrangeSnapshot,
wsRunScenario
}) => {
const leaderboard = new LeaderboardPage(page);
arrangeSnapshot({
subjectId,
leaderboard: buildLeaderboardSnapshot({
guild_id: subjectId,
leaderboard: [
{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
{ user_id: 'user-2', tag_number: 5, total_points: 450, rounds_played: 7 }
]
}),
tags: buildTagListSnapshot({
guild_id: subjectId,
members: [
{ member_id: 'user-1', current_tag: 1 },
{ member_id: 'user-2', current_tag: 5 }
]
})
});

wsRunScenario('contracts/scenarios/leaderboard/updated.round-1.json', { subjectId });
wsRunScenario('contracts/scenarios/leaderboard/tag.swap.processed.simple.json', { subjectId });

await leaderboard.expectFirstUser('user-2');
});

test('reloads snapshot after leaderboard.updated event', async ({
page,
wsStubRequest,
wsRunScenario
}) => {
const leaderboard = new LeaderboardPage(page);
await leaderboard.expectRowCount(3);

wsStubRequest(
`leaderboard.snapshot.request.v2.${subjectId}`,
buildLeaderboardSnapshot({
guild_id: subjectId,
leaderboard: [
{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 },
{ user_id: 'user-3', tag_number: 3, total_points: 425, rounds_played: 6 },
{ user_id: 'user-4', tag_number: 4, total_points: 390, rounds_played: 6 }
]
})
);
wsStubRequest(
`leaderboard.tag.list.requested.v1.${subjectId}`,
buildTagListSnapshot({
guild_id: subjectId,
members: [
{ member_id: 'user-1', current_tag: 1 },
{ member_id: 'user-2', current_tag: 2 },
{ member_id: 'user-3', current_tag: 3 },
{ member_id: 'user-4', current_tag: 4 }
]
})
);

wsRunScenario('contracts/scenarios/leaderboard/updated.round-2.json', { subjectId });
await leaderboard.expectRowCount(4);
});
});
