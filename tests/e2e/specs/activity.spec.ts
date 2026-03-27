import { test, expect } from '../fixtures';

/**
 * Activity E2E Tests
 *
 * The /activity route depends on the Discord Embedded App SDK for auth.
 * We inject a stub SDK via page.addInitScript and intercept token exchange endpoints.
 */
test.describe('Activity Route', () => {
const mockCode = 'mock-discord-auth-code';
const mockRefreshToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const mockTicket = ['header', Buffer.from(JSON.stringify({ active_club_uuid: 'club-1' })).toString('base64'), 'sig'].join('.');

test('shows loading state initially', async ({ page }) => {
await page.addInitScript(() => {
(window as Window & { __discordSdkStub?: unknown }).__discordSdkStub = {
ready: () => new Promise(() => {}),
commands: { authorize: () => new Promise(() => {}) },
guildId: null,
channelId: null
};
});
await page.goto('/activity');

await expect(page.getByText('Connecting to Discord')).toBeVisible({ timeout: 5000 });
});

test('shows auth error when token exchange fails', async ({ page }) => {
await page.route('**/api/auth/discord-activity/token-exchange', (route) =>
route.fulfill({
status: 401,
contentType: 'application/json',
body: JSON.stringify({ error: 'invalid_code' })
})
);
await page.addInitScript((code) => {
(window as Window & { __discordSdkStub?: unknown }).__discordSdkStub = {
ready: () => Promise.resolve(),
commands: { authorize: () => Promise.resolve({ code }) },
subscribe: () => {},
unsubscribe: () => {},
guildId: 'guild-1',
channelId: 'channel-1'
};
}, mockCode);
await page.goto('/activity');

await expect(
page.getByText(/Connecting|Authenticating|Error/)
).toBeVisible({ timeout: 5000 });
});

test('intercepts token-exchange endpoint with correct payload', async ({ page }) => {
await page.route('**/api/auth/discord-activity/token-exchange', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify({
refresh_token: mockRefreshToken,
ticket: mockTicket,
user_uuid: 'user-uuid-1'
})
})
);
await page.route('**/api/auth/ticket', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify({ ticket: mockTicket })
})
);
await page.route('**/api/betting/overview*', (route) =>
route.fulfill({
status: 200,
contentType: 'application/json',
body: JSON.stringify({
club_uuid: 'club-1',
guild_id: 'guild-1',
season_id: 'season-1',
season_name: 'Spring 2025',
access_state: 'enabled',
access_source: 'subscription',
read_only: false,
wallet: { season_points: 100, adjustment_balance: 0, available: 100, reserved: 0 },
settings: { opt_out_targeting: false, updated_at: '' },
journal: []
})
})
);
await page.addInitScript((code) => {
(window as Window & { __discordSdkStub?: unknown }).__discordSdkStub = {
ready: () => Promise.resolve(),
commands: { authorize: () => Promise.resolve({ code }) },
subscribe: () => {},
unsubscribe: () => {},
guildId: 'guild-1',
channelId: 'channel-1'
};
}, mockCode);
await page.goto('/activity');

await expect(
page.getByText(/Connecting|Authenticating|Loading|Error/)
).toBeVisible({ timeout: 5000 });
});
});
