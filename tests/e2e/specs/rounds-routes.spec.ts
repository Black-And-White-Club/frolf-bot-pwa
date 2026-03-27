import { test, expect } from '../fixtures';
import { RoundPage } from '../pages/round.page';
import {
buildLeaderboardSnapshot,
buildRoundCreated,
buildTagListSnapshot
} from '../support/event-builders';

test.describe('Rounds Routes', () => {
const subjectId = 'guild-123';

async function visitRoundsWithSnapshot(
{
arrangeSnapshot,
arrangeAuth,
wsConnect
}: {
arrangeSnapshot: (o?: object) => void;
arrangeAuth: (o?: object) => Promise<void>;
wsConnect: () => Promise<void>;
},
path: string,
rounds: ReturnType<typeof buildRoundCreated>[]
) {
arrangeSnapshot({
subjectId,
rounds,
leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: subjectId, members: [] }),
profiles: {
'user-1': {
user_id: 'user-1',
display_name: 'Player One',
avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
}
}
});
await arrangeAuth({
path,
clubUuid: subjectId,
guildId: subjectId,
role: 'player',
linkedProviders: ['discord']
});
await wsConnect();
}

test('shows grouped round sections and navigates to round detail', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
const round = new RoundPage(page);
await visitRoundsWithSnapshot({ arrangeSnapshot, arrangeAuth, wsConnect }, '/rounds', [
buildRoundCreated({
id: 'round-started',
guild_id: subjectId,
title: 'Morning Live Round',
state: 'started',
participants: [{ user_id: 'user-1', response: 'accepted', score: 54, tag_number: 1 }]
}),
buildRoundCreated({
id: 'round-scheduled',
guild_id: subjectId,
title: 'Weekend Upcoming Round',
state: 'scheduled',
participants: []
}),
buildRoundCreated({
id: 'round-finalized',
guild_id: subjectId,
title: 'Completed Tag Match',
state: 'finalized',
participants: [{ user_id: 'user-1', response: 'accepted', score: 50, tag_number: 1 }]
})
]);

await expect(page.getByRole('heading', { name: 'Rounds', level: 1 })).toBeVisible();
await expect(page.getByText('Live Rounds')).toBeVisible();
await expect(page.getByText('Upcoming Rounds')).toBeVisible();
await expect(page.getByText('Recent Rounds')).toBeVisible();

await round.expectCardVisible('round-started');
await round.expectCardVisible('round-scheduled');
await round.expectCardVisible('round-finalized');

await round.cardById('round-started').click();
expect(new URL(page.url()).pathname).toBe('/rounds/round-started');
await expect(page.getByRole('heading', { name: 'Morning Live Round', level: 1 })).toBeVisible();
await expect(page.getByRole('link', { name: 'Back to rounds' })).toHaveAttribute(
'href',
'/rounds'
);
});

test('renders not-found fallback for unknown round id', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
await visitRoundsWithSnapshot(
{ arrangeSnapshot, arrangeAuth, wsConnect },
'/rounds/missing-round',
[]
);

await expect(page.getByText('Round not found')).toBeVisible();
await expect(page.getByRole('link', { name: 'Back to rounds' })).toHaveAttribute(
'href',
'/rounds'
);
});

test('shows guest sign-in shell for /rounds when unauthenticated', async ({
page,
arrangeGuest
}) => {
await arrangeGuest({ path: '/rounds' });

await expect(page.locator('[data-testid="btn-signin"]')).toBeVisible();
await expect(
page.getByText(
'Sign in with Discord or Google to access your disc golf games.'
)
).toBeVisible();
});
});
