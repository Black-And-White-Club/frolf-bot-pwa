import { test, expect } from '../fixtures';
import { DocsPage } from '../pages/docs.page';
import { LegalPage } from '../pages/legal.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

test.describe('Docs and Legal Routes', () => {
const subjectId = 'guild-123';

test('renders docs overview and navigates between doc sections', async ({
page,
arrangeGuest
}) => {
const docs = new DocsPage(page);
await arrangeGuest({ path: '/docs' });

await docs.expectHeading('Frolf Bot — Documentation');
await docs.clickNavItem('Rounds');
expect(new URL(page.url()).pathname).toBe('/docs/rounds');
await docs.expectHeading('Rounds');
});

test('uses the active docs navigation container for the current layout', async ({
page,
arrangeGuest
}) => {
const docs = new DocsPage(page);
await arrangeGuest({ path: '/docs' });

const isCompact = await docs.isCompactLayout();
if (!isCompact) {
await expect(docs.mobileNavToggle()).toHaveCount(0);
await expect(docs.sidebarNav()).toBeVisible();
await docs.clickNavItem('Tags & Leaderboard');
expect(new URL(page.url()).pathname).toBe('/docs/tags');
await docs.expectHeading('Tags & Leaderboard');
} else {
await expect(docs.mobileNavToggle()).toBeVisible();
await docs.openMobileNav();
await expect(docs.mobileNav()).toBeVisible();
await docs.clickNavItem('Tags & Leaderboard');
expect(new URL(page.url()).pathname).toBe('/docs/tags');
await docs.expectHeading('Tags & Leaderboard');
}
});

test('renders privacy policy and links to terms', async ({ page, arrangeGuest }) => {
const legal = new LegalPage(page);
await arrangeGuest({ path: '/privacy' });

await legal.expectPrivacyPage();
await legal.expectLegalFooterLinks();

await page.getByRole('link', { name: 'Terms of Service' }).first().click();
expect(new URL(page.url()).pathname).toBe('/tos');
await legal.expectTosPage();
});

test('renders terms of service and links back to privacy', async ({
page,
arrangeGuest
}) => {
const legal = new LegalPage(page);
await arrangeGuest({ path: '/tos' });

await legal.expectTosPage();
await legal.expectLegalFooterLinks();

await page.getByRole('link', { name: 'Privacy Policy' }).first().click();
expect(new URL(page.url()).pathname).toBe('/privacy');
await legal.expectPrivacyPage();
});

test('renders auth error route for authenticated sessions', async ({
page,
arrangeSnapshot,
arrangeAuth,
wsConnect
}) => {
arrangeSnapshot({
subjectId,
rounds: [],
leaderboard: buildLeaderboardSnapshot({ guild_id: subjectId, leaderboard: [] }),
tags: buildTagListSnapshot({ guild_id: subjectId, members: [] })
});
await arrangeAuth({
path: '/auth/error',
clubUuid: subjectId,
guildId: subjectId,
role: 'player'
});
await wsConnect();

await expect(page.getByRole('heading', { name: 'Auth Error', level: 1 })).toBeVisible();
await expect(page.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/');
});
});
