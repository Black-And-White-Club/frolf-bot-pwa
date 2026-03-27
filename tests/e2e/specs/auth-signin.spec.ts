import { test, expect } from '../fixtures';
import { SigninPage } from '../pages/signin.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

test.describe('Auth and Sign-in Routes', () => {
const subjectId = 'guild-123';

test('shows guest sign-in call-to-action on home when unauthenticated', async ({
page,
arrangeGuest
}) => {
const signin = new SigninPage(page);
await arrangeGuest({ path: '/' });

await signin.expectGuestSignInCta();
await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
'href',
'/privacy'
);
await expect(page.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
'href',
'/tos'
);
});

test('renders sign-in page for guests', async ({ page, arrangeGuest }) => {
const signin = new SigninPage(page);
await arrangeGuest({ path: '/auth/signin' });

await signin.expectOAuthOnlyUi();
await expect(signin.discordButton()).toHaveAttribute('href', '/api/auth/discord/login');
await expect(signin.googleButton()).toHaveAttribute('href', '/api/auth/google/login');
});

test('preserves redirect query on oauth links', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
const signin = new SigninPage(page);
arrangeSnapshot({
subjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
});
await arrangeAuth({
path: '/auth/signin?redirect=%2Fjoin%3Fcode%3Dclub-abc',
clubUuid: subjectId,
guildId: subjectId,
role: 'admin'
});
await wsConnect();

await expect(signin.discordButton()).toHaveAttribute(
'href',
'/api/auth/discord/login?redirect=%2Fjoin%3Fcode%3Dclub-abc'
);
await expect(signin.googleButton()).toHaveAttribute(
'href',
'/api/auth/google/login?redirect=%2Fjoin%3Fcode%3Dclub-abc'
);
});

test('shows oauth error banner when error query param is set', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
const signin = new SigninPage(page);
arrangeSnapshot({
subjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
});
await arrangeAuth({
path: '/auth/signin?error=oauth_failed',
clubUuid: subjectId,
guildId: subjectId,
role: 'admin'
});
await wsConnect();

await signin.expectOAuthError();
});
});
