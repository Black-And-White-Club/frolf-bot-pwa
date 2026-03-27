import { test, expect } from '../fixtures';
import {
buildLeaderboardSnapshot,
buildRoundListSnapshot,
buildTagListSnapshot
} from '../support/event-builders';

test.describe('Challenges Routes', () => {
const subjectId = 'club-123';
const guildId = 'guild-123';

function buildChallenge(
overrides: Partial<{
id: string;
status: string;
accepted_at: string | null;
accepted_expires_at: string | null;
completed_at: string | null;
linked_round: {
round_id: string;
linked_at: string;
is_active: boolean;
unlinked_at?: string | null;
} | null;
}> = {}
) {
return {
id: overrides.id ?? 'challenge-1',
club_uuid: subjectId,
discord_guild_id: guildId,
status: overrides.status ?? 'open',
challenger_user_uuid: 'user-uuid-1',
defender_user_uuid: 'user-uuid-2',
challenger_external_id: 'user-1',
defender_external_id: 'user-2',
original_tags: { challenger: 8, defender: 3 },
current_tags: { challenger: 8, defender: 3 },
opened_at: '2026-03-10T12:00:00Z',
open_expires_at: '2026-03-12T12:00:00Z',
accepted_at: overrides.accepted_at ?? null,
accepted_expires_at: overrides.accepted_expires_at ?? null,
linked_round: overrides.linked_round ?? null,
completed_at: overrides.completed_at ?? null,
hidden_at: null,
hidden_by_user_uuid: null,
message_binding: null
};
}

async function arrangeChallengeSession(
{
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect
}: {
arrangeSnapshot: (o?: object) => void;
wsStubRequest: (s: string, p: unknown) => void;
arrangeAuth: (o?: object) => Promise<void>;
wsConnect: () => Promise<void>;
},
path: string,
challengeListStub: unknown,
challengeDetailStub: unknown
) {
arrangeSnapshot({
subjectId,
rounds: buildRoundListSnapshot({
rounds: [
{
id: 'round-55',
guild_id: guildId,
title: 'Challenge Finals',
location: 'Pier Park',
description: '',
start_time: '2026-03-14T16:00:00Z',
state: 'scheduled',
created_by: 'user-1',
event_message_id: 'msg-55',
participants: []
}
]
}).rounds,
leaderboard: buildLeaderboardSnapshot({ guild_id: guildId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: guildId, members: [] })
});
wsStubRequest(`club.challenge.list.request.v1.${subjectId}`, challengeListStub);
wsStubRequest(`club.challenge.detail.request.v1.${subjectId}`, challengeDetailStub);
await arrangeAuth({
path,
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord']
});
await wsConnect();
}

test('renders the challenge board and deep-links cards to the detail route', async ({
page,
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect
}) => {
const openChallenge = buildChallenge({ id: 'challenge-open' });
const acceptedChallenge = buildChallenge({
id: 'challenge-accepted',
status: 'accepted',
accepted_at: '2026-03-10T13:00:00Z',
accepted_expires_at: '2026-03-14T13:00:00Z'
});

await arrangeChallengeSession(
{ arrangeSnapshot, wsStubRequest, arrangeAuth, wsConnect },
'/challenges',
{ challenges: [openChallenge, acceptedChallenge] },
{ challenge: openChallenge }
);

await expect(page.locator('[data-testid="challenges-page"]')).toBeVisible();
await expect(page.locator('[data-testid="challenge-board"]')).toBeVisible();
await expect(page.locator('[data-testid="challenge-card-challenge-open"]')).toBeVisible();

const viewLink = page
.locator('[data-testid="challenge-card-challenge-open"]')
.getByRole('link', { name: 'View challenge' });
await expect(viewLink).toHaveAttribute('href', '/challenges/challenge-open');
await viewLink.click();

expect(new URL(page.url()).pathname).toBe('/challenges/challenge-open');
await expect(page.locator('[data-testid="challenge-detail-page"]')).toBeVisible();
});

test('loads archived challenges on the detail route even when they are not board-visible', async ({
page,
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect,
wsAssertPublished
}) => {
await arrangeChallengeSession(
{ arrangeSnapshot, wsStubRequest, arrangeAuth, wsConnect },
'/challenges/challenge-completed',
{ challenges: [buildChallenge({ id: 'challenge-open' })] },
{
challenge: buildChallenge({
id: 'challenge-completed',
status: 'completed',
accepted_at: '2026-03-10T13:00:00Z',
completed_at: '2026-03-10T18:00:00Z',
linked_round: {
round_id: 'round-55',
linked_at: '2026-03-10T14:00:00Z',
is_active: false,
unlinked_at: '2026-03-10T18:30:00Z'
}
})
}
);

await expect(page.locator('[data-testid="challenge-detail-page"]')).toBeVisible();

const entries = wsAssertPublished(`club.challenge.detail.request.v1.${subjectId}`);
const lastEntry = entries[entries.length - 1];
expect(lastEntry.payload).toEqual({
guild_id: guildId,
club_uuid: subjectId,
challenge_id: 'challenge-completed'
});

const card = page.locator('[data-testid="challenge-card-challenge-completed"]');
await expect(card).toHaveAttribute('data-challenge-status', 'completed');
await expect(card).toContainText('Completed');
await expect(page.getByText('Challenge Finals')).toBeVisible();
await expect(page.getByText('Completed')).toBeVisible();
});
});
