import { test, expect } from '../fixtures';
import { CreateRoundPage } from '../pages/create-round.page';
import { RoundPage } from '../pages/round.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

test.describe('Round Create Route', () => {
const subjectId = 'guild-123';

function buildChallenge(
id: string,
overrides: Partial<{
status: string;
discord_guild_id: string | null;
accepted_at: string | null;
accepted_expires_at: string | null;
linked_round: { round_id: string; linked_at: string; is_active: boolean } | null;
}> = {}
) {
return {
id,
club_uuid: 'club-123',
discord_guild_id: overrides.discord_guild_id ?? 'guild-123',
status: overrides.status ?? 'accepted',
challenger_user_uuid: 'user-uuid-1',
defender_user_uuid: 'user-uuid-2',
challenger_external_id: 'user-1',
defender_external_id: 'user-2',
original_tags: { challenger: 8, defender: 3 },
current_tags: { challenger: 8, defender: 3 },
opened_at: '2026-03-10T12:00:00Z',
open_expires_at: '2026-03-12T12:00:00Z',
accepted_at: overrides.accepted_at ?? '2026-03-10T13:00:00Z',
accepted_expires_at: overrides.accepted_expires_at ?? '2026-03-14T13:00:00Z',
linked_round: overrides.linked_round ?? null,
completed_at: null,
hidden_at: null,
hidden_by_user_uuid: null,
message_binding: null
};
}

async function arrangeRoundCreateSession(
{
arrangeSnapshot,
arrangeAuth,
wsConnect
}: { arrangeSnapshot: (o?: object) => void; arrangeAuth: (o?: object) => Promise<void>; wsConnect: (o?: object) => Promise<void> },
role: 'viewer' | 'player' | 'editor' | 'admin',
path: string
) {
arrangeSnapshot({
subjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
});
await arrangeAuth({
path,
clubUuid: subjectId,
guildId: subjectId,
role,
linkedProviders: ['discord']
});
await wsConnect();
}

test('allows player to submit create-round request and returns to rounds route', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect,
wsAssertPublished,
wsRunScenario
}) => {
const createRound = new CreateRoundPage(page);
const round = new RoundPage(page);
await arrangeRoundCreateSession(
{ arrangeSnapshot, arrangeAuth, wsConnect },
'player',
'/rounds'
);
wsAssertPublished(`round.list.request.v2.${subjectId}`);

await expect(createRound.createRouteButton()).toBeVisible();
await createRound.createRouteButton().click();
expect(new URL(page.url()).pathname).toBe('/rounds/create');
await expect(createRound.createPage()).toBeVisible();

await createRound.fillForm({
title: 'PWA Created Round',
description: 'Testing web create flow',
startTime: '2026-02-24 18:30',
timezone: 'America/Chicago',
location: 'Pier Park'
});
await createRound.submit();

wsAssertPublished('round.creation.requested.v2', (entry) => {
const payload = entry.payload as Record<string, string>;
return (
payload.guild_id === subjectId &&
payload.user_id === 'user-1' &&
payload.title === 'PWA Created Round' &&
payload.location === 'Pier Park' &&
payload.start_time === '2026-02-24 18:30' &&
payload.timezone === 'America/Chicago' &&
payload.channel_id === ''
);
});

expect(new URL(page.url()).pathname).toBe('/rounds');
expect(new URL(page.url()).search).toContain('created=requested');
await createRound.expectRequestedBannerVisible();

wsRunScenario('contracts/scenarios/round/created.simple.json', { subjectId });
await round.expectCardVisible('round-1');
});

test('hides create button for viewer and blocks direct access to /rounds/create', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
const createRound = new CreateRoundPage(page);
await arrangeRoundCreateSession(
{ arrangeSnapshot, arrangeAuth, wsConnect },
'viewer',
'/rounds'
);

await expect(createRound.createRouteButton()).toHaveCount(0);

await page.goto('/rounds/create');
expect(new URL(page.url()).pathname).toBe('/rounds');
});

test('deep-links challenge scheduling into create-round and returns to the challenge detail route', async ({
page,
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect,
wsAssertPublished
}) => {
const clubSubjectId = 'club-123';
const guildId = 'guild-123';
const challengeId = '11111111-1111-1111-1111-111111111111';
const acceptedChallenge = buildChallenge(challengeId);
const createRound = new CreateRoundPage(page);

arrangeSnapshot({
subjectId: clubSubjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({ guild_id: guildId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: guildId, members: [] })
});
wsStubRequest(`club.challenge.list.request.v1.${clubSubjectId}`, {
challenges: [acceptedChallenge]
});
wsStubRequest(`club.challenge.detail.request.v1.${clubSubjectId}`, {
challenge: acceptedChallenge
});
await arrangeAuth({
path: `/challenges/${challengeId}`,
clubUuid: clubSubjectId,
guildId,
role: 'player',
linkedProviders: ['discord']
});
await wsConnect();

await page
.locator(`[data-testid="challenge-card-${challengeId}"]`)
.getByRole('link', { name: 'Create Round' })
.click();

expect(new URL(page.url()).pathname).toBe('/rounds/create');
expect(new URL(page.url()).search).toContain(`challenge=${challengeId}`);
await expect(
page.getByText('This round will auto-link to the selected challenge')
).toBeVisible();
await expect(page.locator('[data-testid="link-create-round-cancel"]')).toHaveAttribute(
'href',
`/challenges/${challengeId}`
);

await createRound.fillForm({
title: 'Challenge Match',
description: 'Created from a challenge detail route',
startTime: '2026-03-14 16:00',
timezone: 'America/New_York',
location: 'Pier Park'
});
await createRound.submit();

wsAssertPublished('round.creation.requested.v2', (entry) => {
const payload = entry.payload as Record<string, string>;
return (
payload.guild_id === guildId &&
payload.user_id === 'user-1' &&
payload.title === 'Challenge Match' &&
payload.location === 'Pier Park' &&
payload.challenge_id === challengeId
);
});

expect(new URL(page.url()).pathname).toBe(`/challenges/${challengeId}`);
expect(new URL(page.url()).search).toContain('created=requested');
await expect(
page.getByText(
'Round creation requested. The challenge will auto-link after the round is created.'
)
).toBeVisible();
});

test('deep-links challenge scheduling for a club without a discord guild mapping', async ({
page,
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect,
wsAssertPublished
}) => {
const clubSubjectId = 'club-123';
const challengeId = '99999999-1111-1111-1111-111111111111';
const acceptedChallenge = buildChallenge(challengeId, { discord_guild_id: null });
const createRound = new CreateRoundPage(page);

arrangeSnapshot({
subjectId: clubSubjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({ guild_id: clubSubjectId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: clubSubjectId, members: [] })
});
wsStubRequest(`club.challenge.list.request.v1.${clubSubjectId}`, {
challenges: [acceptedChallenge]
});
wsStubRequest(`club.challenge.detail.request.v1.${clubSubjectId}`, {
challenge: acceptedChallenge
});
await arrangeAuth({
path: `/challenges/${challengeId}`,
clubUuid: clubSubjectId,
role: 'player',
linkedProviders: [],
claims: { guild: '' }
});
await wsConnect();

await page
.locator(`[data-testid="challenge-card-${challengeId}"]`)
.getByRole('link', { name: 'Create Round' })
.click();

expect(new URL(page.url()).pathname).toBe('/rounds/create');
expect(new URL(page.url()).search).toContain(`challenge=${challengeId}`);

await createRound.fillForm({
title: 'Club Scoped Challenge Match',
description: 'Created without a discord guild mapping',
startTime: '2026-03-15 16:00',
timezone: 'America/New_York',
location: 'Pier Park'
});
await createRound.submit();

wsAssertPublished('round.creation.requested.v2', (entry) => {
const payload = entry.payload as Record<string, string>;
return (
payload.guild_id === clubSubjectId &&
payload.user_id === 'user-1' &&
payload.title === 'Club Scoped Challenge Match' &&
payload.challenge_id === challengeId
);
});

expect(new URL(page.url()).pathname).toBe(`/challenges/${challengeId}`);
expect(new URL(page.url()).search).toContain('created=requested');
});
});
