import { test, expect } from '../fixtures';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { RoundPage } from '../pages/round.page';
import {
buildLeaderboardSnapshot,
buildRoundCreated,
buildTagListSnapshot
} from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Dashboard Snapshot + Live Events', () => {
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
rounds: [
buildRoundCreated({
id: 'round-stub-1',
guild_id: subjectId,
title: 'Stubbed Round',
state: 'started',
participants: [
{
user_id: 'user-1',
response: 'accepted',
score: null,
tag_number: 1
}
]
})
],
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
}),
profiles: {
'user-1': {
user_id: 'user-1',
display_name: 'Stubbed Player One',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
},
'user-2': {
user_id: 'user-2',
display_name: 'Stubbed Player Two',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png'
}
}
});

await arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
await wsConnect();
await expectDashboardLoaded(page);
wsAssertPublished(`round.list.request.v2.${subjectId}`);
});

test('renders snapshot data without waiting for full end-to-end flow', async ({
page
}) => {
const round = new RoundPage(page);
const leaderboard = new LeaderboardPage(page);

await expect(round.cards()).toHaveCount(1);
await round.expectCardContains('round-stub-1', 'Stubbed Round');
await leaderboard.expectRowCount(2);
await expect(page.getByText('Stubbed Player One')).toBeVisible();
});

test('applies live websocket events after initial snapshot', async ({
page,
wsRunScenario
}) => {
const round = new RoundPage(page);
const leaderboard = new LeaderboardPage(page);

await expect(round.cards()).toHaveCount(1);

wsRunScenario('contracts/scenarios/round/created.live.json', { subjectId });
wsRunScenario('contracts/scenarios/leaderboard/tag.updated.simple.json', { subjectId });

await expect(round.cards()).toHaveCount(2);
await round.expectCardContains('round-live-2', 'Live Round from WS');
await leaderboard.expectFirstUser('user-2');
});
});
