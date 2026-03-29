import { test, expect } from '../fixtures';
import { buildMockTicket } from '../fixtures/auth.fixture';
import { JoinPage } from '../pages/join.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Join Page', () => {
	const subjectId = 'guild-123';

	async function arrangeAuthenticated(
		{
			arrangeSnapshot,
			arrangeAuth,
			wsConnect
		}: {
			arrangeSnapshot: (o?: object) => void;
			arrangeAuth: (o?: object) => Promise<void>;
			wsConnect: () => Promise<void>;
		},
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
			role: 'player',
			linkedProviders: ['discord']
		});
		await wsConnect();
	}

	test('shows invite code lookup form when no code is provided', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const join = new JoinPage(page);
		await arrangeAuthenticated({ arrangeSnapshot, arrangeAuth, wsConnect }, '/join');

		await expect(join.codeInput()).toBeVisible();
		await expect(join.lookupButton()).toBeVisible();
	});

	test('navigates to join code preview after looking up a code', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const join = new JoinPage(page);
		await page.route('**/api/clubs/preview?code=ABC123', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ club_uuid: subjectId, club_name: 'Pier Park Club', role: 'player' })
			})
		);
		await arrangeAuthenticated({ arrangeSnapshot, arrangeAuth, wsConnect }, '/join');

		await join.codeInput().fill('ABC123');
		const previewResponse = page.waitForResponse('**/api/clubs/preview?code=ABC123');
		await join.lookupButton().click();
		await previewResponse;

		expect(new URL(page.url()).search).toBe('?code=ABC123');
		await join.expectPreviewClub('Pier Park Club');
	});

	test('shows an invalid invite state when preview endpoint fails', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const join = new JoinPage(page);
		await page.route('**/api/clubs/preview?code=BADCODE', (route) =>
			route.fulfill({
				status: 404,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Invalid or expired invite code' })
			})
		);
		await arrangeAuthenticated({ arrangeSnapshot, arrangeAuth, wsConnect }, '/join?code=BADCODE');

		await page.waitForResponse('**/api/clubs/preview?code=BADCODE');
		await join.expectInvalidInvite('Invalid or expired invite code');
	});

	test('joins club successfully from invite preview and redirects home', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const join = new JoinPage(page);
		await page.route('**/api/clubs/preview?code=GOODCODE', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ club_uuid: subjectId, club_name: 'Pier Park Club', role: 'player' })
			})
		);
		await page.route('**/api/clubs/join-by-code', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ ok: true })
			})
		);
		await arrangeAuthenticated({ arrangeSnapshot, arrangeAuth, wsConnect }, '/join?code=GOODCODE');

		await page.waitForResponse('**/api/clubs/preview?code=GOODCODE');
		const joinResponse = page.waitForResponse('**/api/clubs/join-by-code');
		await join.joinButton().click();
		await joinResponse;

		await expect.poll(() => new URL(page.url()).pathname).toBe('/');
		await expectDashboardLoaded(page);
	});

	test('first-time club join: transitions from needs-club to live mode', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const join = new JoinPage(page);
		const newClubUuid = 'club-first-456';

		// Snapshot stubs for the new club (used by dataLoader.loadInitialData after join)
		arrangeSnapshot({
			subjectId: newClubUuid,
			rounds: [],
			leaderboard: buildLeaderboardSnapshot({ guild_id: newClubUuid, leaderboard: [] }),
			tags: buildTagListSnapshot({ guild_id: newClubUuid, members: [] })
		});

		await page.route('**/api/clubs/preview?code=FIRSTJOIN', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ club_uuid: newClubUuid, club_name: 'First Club', role: 'player' })
			})
		);
		await page.route('**/api/clubs/join-by-code', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ ok: true })
			})
		);

		// Initial auth: no clubs — puts app in needsClub state.
		// The /join route is exempt from the ClubDiscovery overlay.
		await arrangeAuth({
			path: '/join?code=FIRSTJOIN',
			clubs: [],
			activeClubUuid: '',
			guildId: newClubUuid,
			role: 'viewer',
			linkedProviders: ['discord']
		});
		// No NATS connection during init (user has no clubs), but we still call wsConnect
		// to ensure the mock WebSocket handler is active before onClubJoined fires.
		await wsConnect({ minSubscriptions: 0 });

		// After join, ticket requests return a token that includes the new club.
		const postJoinTicket = buildMockTicket({
			active_club_uuid: newClubUuid,
			guild: newClubUuid,
			role: 'player',
			clubs: [
				{
					club_uuid: newClubUuid,
					role: 'player',
					display_name: 'Test User',
					avatar_url: ''
				}
			]
		});
		await page.route('**/api/auth/ticket', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ ticket: postJoinTicket })
			})
		);

		await page.waitForResponse('**/api/clubs/preview?code=FIRSTJOIN');
		const joinResponse = page.waitForResponse('**/api/clubs/join-by-code');
		await join.joinButton().click();
		await joinResponse;

		await expect.poll(() => new URL(page.url()).pathname).toBe('/');
		await expectDashboardLoaded(page);
	});

	test('shows error when join-by-code request fails', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const join = new JoinPage(page);
		await page.route('**/api/clubs/preview?code=USED001', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ club_uuid: subjectId, club_name: 'Pier Park Club', role: 'player' })
			})
		);
		await page.route('**/api/clubs/join-by-code', (route) =>
			route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Invite already used' })
			})
		);
		await arrangeAuthenticated({ arrangeSnapshot, arrangeAuth, wsConnect }, '/join?code=USED001');

		await page.waitForResponse('**/api/clubs/preview?code=USED001');
		const joinResponse = page.waitForResponse('**/api/clubs/join-by-code');
		await join.joinButton().click();
		await joinResponse;

		await expect(page.getByText('Invite already used')).toBeVisible();
	});
});
