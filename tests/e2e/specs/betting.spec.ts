import { test, expect } from '../fixtures';
import { NavPage } from '../pages/nav.page';
import { buildLeaderboardSnapshot, buildRoundCreated, buildTagListSnapshot } from '../support/event-builders';

test.describe('Betting Feature', () => {
const subjectId = 'club-betting-1';
const guildId = 'guild-betting-1';

const enabledEntitlements = {
features: {
betting: { key: 'betting', state: 'enabled' as const, source: 'subscription', reason: '' }
}
};
const frozenEntitlements = {
features: {
betting: {
key: 'betting',
state: 'frozen' as const,
source: 'manual_deny',
reason: 'Payment lapsed'
}
}
};

const mockOverview = {
club_uuid: subjectId,
guild_id: guildId,
season_id: 'season-2025',
season_name: 'Spring 2025',
access_state: 'enabled',
access_source: 'subscription',
read_only: false,
wallet: { season_points: 150, adjustment_balance: 10, available: 140, reserved: 10 },
settings: { opt_out_targeting: false, updated_at: '' },
journal: [
{
id: 1,
entry_type: 'stake_reserve',
amount: -10,
reason: 'Stake reserve for round winner market',
created_at: new Date().toISOString()
}
]
};

const mockMarketSnapshot = {
club_uuid: subjectId,
guild_id: guildId,
season_id: 'season-2025',
access_state: 'enabled',
round: {
id: 'round-bet-1',
title: 'Spring Open Round 1',
start_time: '2099-06-01T10:00:00Z'
},
market: {
id: 1,
type: 'round_winner',
title: 'Round Winner',
status: 'open',
locks_at: '2099-06-01T09:55:00Z',
ephemeral: false,
options: [
{
option_key: 'player-1',
member_id: 'user-1',
label: 'Player One',
probability_percent: 60,
decimal_odds: 1.67
},
{
option_key: 'player-2',
member_id: 'user-2',
label: 'Player Two',
probability_percent: 40,
decimal_odds: 2.5
}
]
}
};

const mockMarketSnapshotFrozen = {
...mockMarketSnapshot,
access_state: 'frozen',
market: undefined
};

async function arrangeBaseSnapshot({
arrangeSnapshot
}: { arrangeSnapshot: (o?: object) => void }) {
arrangeSnapshot({
subjectId,
rounds: [
buildRoundCreated({
id: 'round-bet-1',
guild_id: guildId,
title: 'Spring Open Round 1',
state: 'scheduled',
participants: []
})
],
leaderboard: buildLeaderboardSnapshot({
guild_id: guildId,
leaderboard: [
{ user_id: 'user-1', tag_number: 1, total_points: 150, rounds_played: 5 },
{ user_id: 'user-2', tag_number: 2, total_points: 120, rounds_played: 4 }
]
}),
tags: buildTagListSnapshot({
guild_id: guildId,
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
}

test.describe('enabled state', () => {
test.beforeEach(async ({ page, arrangeSnapshot, wsStubRequest, arrangeAuth, wsConnect }) => {
await arrangeBaseSnapshot({ arrangeSnapshot });
wsStubRequest(`betting.snapshot.request.v1.${subjectId}`, mockMarketSnapshot);
await page.route('**/api/betting/overview*', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify(mockOverview)
})
);
await arrangeAuth({
path: '/betting',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord'],
entitlements: enabledEntitlements
});
await wsConnect();
await page.waitForResponse('**/api/betting/overview*');
});

test('shows the enabled access badge', async ({ page }) => {
await expect(page.getByText('enabled').first()).toBeVisible();
});

test('renders wallet stats after data loads', async ({ page }) => {
await expect(page.getByText('Available Wallet')).toBeVisible();
await expect(page.getByText('Season Mirror')).toBeVisible();
await expect(page.getByText('Ledger Delta')).toBeVisible();
});

test('renders the next market section with player options from NATS snapshot', async ({
page
}) => {
await expect(page.getByText('Next Market')).toBeVisible();
await expect(page.getByText('Player One')).toBeVisible();
await expect(page.getByText('Player Two')).toBeVisible();
});

test('auto-selects first option and enables the place-bet button', async ({ page }) => {
await expect(page.getByRole('button', { name: /Place Bet|Placing/i })).not.toBeDisabled();
});

test('renders wallet journal entries', async ({ page }) => {
await expect(page.getByText('Wallet Journal')).toBeVisible();
await expect(page.getByText('Stake reserve for round winner market')).toBeVisible();
});

test('renders the targeting preference toggle', async ({ page }) => {
await expect(page.getByText('Targeting Preference')).toBeVisible();
await expect(page.getByText('Opt out')).toBeVisible();
});
});

test.describe('market lifecycle events', () => {
test('updates market status to locked when market.locked event is received', async ({
page,
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect,
wsEmit
}) => {
await arrangeBaseSnapshot({ arrangeSnapshot });
wsStubRequest(`betting.snapshot.request.v1.${subjectId}`, mockMarketSnapshot);
await page.route('**/api/betting/overview*', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify(mockOverview)
})
);
await arrangeAuth({
path: '/betting',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord'],
entitlements: enabledEntitlements
});
await wsConnect();
await expect(page.getByText('Player One')).toBeVisible();

wsEmit(
`betting.market.locked.v1.${subjectId}`,
{
guild_id: guildId,
club_uuid: subjectId,
round_id: 'round-bet-1',
market_id: 1
},
{ validate: false }
);

await expect(page.getByText(/locked/i)).toBeVisible();
await expect(page.getByRole('button', { name: /Place Bet|Placing/i })).toBeDisabled();
});

test('clears market when voided event is received', async ({
page,
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect,
wsEmit
}) => {
await arrangeBaseSnapshot({ arrangeSnapshot });
wsStubRequest(`betting.snapshot.request.v1.${subjectId}`, mockMarketSnapshot);
await page.route('**/api/betting/overview*', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify(mockOverview)
})
);
await arrangeAuth({
path: '/betting',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord'],
entitlements: enabledEntitlements
});
await wsConnect();
await expect(page.getByText('Player One')).toBeVisible();

wsEmit(
`betting.market.voided.v1.${subjectId}`,
{
guild_id: guildId,
club_uuid: subjectId,
round_id: 'round-bet-1',
market_id: 1,
reason: 'No show'
},
{ validate: false }
);

await expect(page.getByText('Player One')).toHaveCount(0);
});

test('reloads overview when market.settled event is received', async ({
page,
arrangeSnapshot,
wsStubRequest,
arrangeAuth,
wsConnect,
wsEmit
}) => {
const settledOverview = {
...mockOverview,
wallet: { ...mockOverview.wallet, available: 200, adjustment_balance: 60 }
};

await arrangeBaseSnapshot({ arrangeSnapshot });
wsStubRequest(`betting.snapshot.request.v1.${subjectId}`, mockMarketSnapshot);
await page.route('**/api/betting/overview*', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify(mockOverview)
})
);
await arrangeAuth({
path: '/betting',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord'],
entitlements: enabledEntitlements
});
await wsConnect();
await expect(page.getByText('Player One')).toBeVisible();

// Override overview after initial load for the settle reload
await page.route('**/api/betting/overview*', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify(settledOverview)
})
);

const overviewReload = page.waitForResponse('**/api/betting/overview*');
wsEmit(
`betting.market.settled.v1.${subjectId}`,
{
guild_id: guildId,
club_uuid: subjectId,
round_id: 'round-bet-1',
market_id: 1,
settlement_version: 1,
result_summary: 'Player One won'
},
{ validate: false }
);
await overviewReload;

await expect(page.getByText('200')).toBeVisible();
});
});

test.describe('frozen state', () => {
test.beforeEach(async ({ page, arrangeSnapshot, wsStubRequest, arrangeAuth, wsConnect }) => {
await arrangeBaseSnapshot({ arrangeSnapshot });
wsStubRequest(`betting.snapshot.request.v1.${subjectId}`, mockMarketSnapshotFrozen);
await page.route('**/api/betting/overview*', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify({ ...mockOverview, access_state: 'frozen', read_only: true })
})
);
await arrangeAuth({
path: '/betting',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord'],
entitlements: frozenEntitlements
});
await wsConnect();
});

test('shows the frozen access badge', async ({ page }) => {
await expect(page.getByText(/frozen/i).first()).toBeVisible();
});

test('shows the wallet section (read-only history available)', async ({ page }) => {
await page.waitForResponse('**/api/betting/overview*');
await expect(page.getByText('Available Wallet')).toBeVisible();
});

test('shows the frozen body copy', async ({ page }) => {
await expect(page.getByText('read-only freeze')).toBeVisible();
});

test('does not show an active bet form in frozen state', async ({ page }) => {
await expect(page.getByText('Place Bet')).toHaveCount(0);
});
});

test.describe('disabled state', () => {
test('redirects to home when betting is disabled', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
await arrangeBaseSnapshot({ arrangeSnapshot });
await arrangeAuth({
path: '/betting',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord']
// no entitlements → defaults to disabled
});
await wsConnect();

expect(new URL(page.url()).pathname).toBe('/');
});
});

test.describe('navigation', () => {
test('shows betting nav link when entitlements are enabled', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
const nav = new NavPage(page);
await arrangeBaseSnapshot({ arrangeSnapshot });
await arrangeAuth({
path: '/',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord'],
entitlements: enabledEntitlements
});
await wsConnect();

await nav.expectLinkVisible('Betting', '/betting');
});

test('shows betting nav link when entitlements are frozen', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
const nav = new NavPage(page);
await arrangeBaseSnapshot({ arrangeSnapshot });
await arrangeAuth({
path: '/',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord'],
entitlements: frozenEntitlements
});
await wsConnect();

await nav.expectLinkVisible('Betting', '/betting');
});

test('hides betting nav link when no entitlements (disabled)', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
const nav = new NavPage(page);
await arrangeBaseSnapshot({ arrangeSnapshot });
await arrangeAuth({
path: '/',
clubUuid: subjectId,
guildId,
role: 'player',
linkedProviders: ['discord']
});
await wsConnect();

await nav.withPrimaryNavigation(async () => {
await expect(page.locator('a[href="/betting"]')).toHaveCount(0);
});
});
});
});
