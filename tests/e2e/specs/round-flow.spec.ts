import { test } from '../fixtures';
import { RoundPage } from '../pages/round.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Round Flow', () => {
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
leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
});
await arrangeAuth({ clubUuid: subjectId, guildId: subjectId });
await wsConnect({
requiredSubjects: [
`round.created.v2.${subjectId}`,
`round.started.v2.${subjectId}`,
`round.finalized.v2.${subjectId}`,
`round.participant.joined.v2.${subjectId}`,
`round.participant.score.updated.v2.${subjectId}`,
`round.deleted.v2.${subjectId}`
]
});
await expectDashboardLoaded(page);
wsAssertPublished(`round.list.request.v2.${subjectId}`);
});

test('displays a new round when round.created is received', async ({ page, wsRunScenario }) => {
const round = new RoundPage(page);
wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });

await round.expectCardVisible('round-1');
await round.expectCardContains('round-1', 'Weekly Tag Round');
await round.expectCardContains('round-1', 'Pier Park');
});

test('updates card state when round.started is received', async ({ page, wsRunScenario }) => {
const round = new RoundPage(page);
wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });
wsRunScenario('contracts/scenarios/round/started.round-1.json', { subjectId });

await round.expectCardState('round-1', 'started');
});

test('updates participant count when round.participant.joined is received', async ({
page,
wsRunScenario
}) => {
const round = new RoundPage(page);
wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });
wsRunScenario('contracts/scenarios/round/participant.joined.round-1.json', { subjectId });

await round.expectParticipantLabel('round-1', 1);
});

test('shows score preview after round.participant.score.updated on finalized rounds', async ({
page,
wsRunScenario
}) => {
const round = new RoundPage(page);
wsRunScenario('contracts/scenarios/round/created.finalized.with-score-target.json', {
subjectId
});
wsRunScenario('contracts/scenarios/round/participant.score.updated.round-1-user-2.json', {
subjectId
});

await round.expectCardContains('round-1', '-3');
});

test('removes the round card when round.deleted is received', async ({
page,
wsRunScenario
}) => {
const round = new RoundPage(page);
wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });
await round.expectCardVisible('round-1');

wsRunScenario('contracts/scenarios/round/deleted.round-1.json', { subjectId });
await round.expectCardMissing('round-1');
});
});
