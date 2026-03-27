import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages/dashboard.page';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { RoundPage } from '../pages/round.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { expectDashboardLoaded, expectLeaderboardLoaded } from '../support/helpers';

test.describe('Dashboard', () => {
const subjectId = 'guild-123';

test.describe('Mock Mode', () => {
test('displays dashboard shells without live NATS', async ({ page, visitMockMode }) => {
const dashboard = new DashboardPage(page);
await visitMockMode();

await expectDashboardLoaded(page);
const count = await dashboard.roundCards().count();
expect(count).toBeGreaterThanOrEqual(1);
});

test('shows loading state and then round cards', async ({ page, visitMockMode }) => {
const dashboard = new DashboardPage(page);
await visitMockMode();

const count = await dashboard.roundCards().count();
expect(count).toBeGreaterThanOrEqual(1);
});
});

test.describe('Live NATS Events', () => {
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
leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
});
await arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
await wsConnect();
await expectDashboardLoaded(page);
const leaderboard = new LeaderboardPage(page);
await leaderboard.setMode('points');
wsAssertPublished(`round.list.request.v2.${subjectId}`);
});

test('renders newly created round from event stream', async ({ page, wsRunScenario }) => {
const round = new RoundPage(page);
wsRunScenario('contracts/scenarios/round/created.live.json', { subjectId });

await round.expectCardContains('round-live-2', 'Live Round from WS');
});

test('reloads leaderboard snapshot after leaderboard.updated event', async ({
page,
arrangeSnapshot,
wsRunScenario
}) => {
arrangeSnapshot({
subjectId,
leaderboard: buildLeaderboardSnapshot({
leaderboard: [
{ tag_number: 1, user_id: 'user-live-1', total_points: 1111, rounds_played: 14 }
]
})
});
wsRunScenario('contracts/scenarios/leaderboard/updated.round-1.json', { subjectId });

await expectLeaderboardLoaded(page, { minRows: 1 });
});
});
});
