import { test, expect } from '../fixtures';
import { CreateRoundPage } from '../pages/create-round.page';
import { buildLeaderboardSnapshot, buildTagListSnapshot } from '../support/event-builders';

test.describe('Round Create Route', () => {
	const subjectId = 'guild-123';

	async function seedChallengeStore(
		page: import('@playwright/test').Page,
		{
			board = [],
			detail = null
		}: {
			board?: Array<Record<string, unknown>>;
			detail?: Record<string, unknown> | null;
		}
	): Promise<void> {
		await page.evaluate(
			async ({ rawBoard, rawDetail }) => {
				const { challengeStore } = await import('/src/lib/stores/challenges.svelte.ts');

				const optStr = (val: unknown): string | null => (typeof val === 'string' ? val : null);
				const optTag = (tags: unknown, key: string): number | null => {
					const obj = tags as Record<string, unknown> | undefined;
					return typeof obj?.[key] === 'number' ? (obj[key] as number) : null;
				};
				const normalizeLinkedRound = (lr: unknown) => {
					if (!lr || typeof lr !== 'object') return null;
					const l = lr as Record<string, unknown>;
					return {
						roundId: String(l.round_id ?? ''),
						linkedAt: String(l.linked_at ?? ''),
						unlinkedAt: null,
						linkedByUserUuid: null,
						unlinkedByUserUuid: null,
						isActive: l.is_active === true
					};
				};
				const normalizeSummary = (raw: Record<string, unknown>) => ({
					id: String(raw.id),
					clubUuid: String(raw.club_uuid ?? ''),
					discordGuildId: optStr(raw.discord_guild_id),
					status: String(raw.status),
					challengerUserUuid: String(raw.challenger_user_uuid ?? ''),
					defenderUserUuid: String(raw.defender_user_uuid ?? ''),
					challengerExternalId: optStr(raw.challenger_external_id),
					defenderExternalId: optStr(raw.defender_external_id),
					originalTags: {
						challenger: optTag(raw.original_tags, 'challenger'),
						defender: optTag(raw.original_tags, 'defender')
					},
					currentTags: {
						challenger: optTag(raw.current_tags, 'challenger'),
						defender: optTag(raw.current_tags, 'defender')
					},
					openedAt: String(raw.opened_at ?? ''),
					openExpiresAt: optStr(raw.open_expires_at),
					acceptedAt: optStr(raw.accepted_at),
					acceptedExpiresAt: optStr(raw.accepted_expires_at),
					linkedRound: normalizeLinkedRound(raw.linked_round)
				});

				(challengeStore as typeof challengeStore & { currentDetailId: string | null }).board =
					rawBoard.map(normalizeSummary);
				(challengeStore as typeof challengeStore & { detail: unknown }).detail = rawDetail
					? {
							...normalizeSummary(rawDetail),
							completedAt: null,
							hiddenAt: null,
							hiddenByUserUuid: null,
							messageBinding: null
						}
					: null;
				(
					challengeStore as typeof challengeStore & { currentDetailId: string | null }
				).currentDetailId = typeof rawDetail?.id === 'string' ? rawDetail.id : null;
				challengeStore.isLoading = false;
				challengeStore.detailLoading = false;
				challengeStore.errorMessage = null;
				challengeStore.detailError = null;
			},
			{ rawBoard: board, rawDetail: detail }
		);
	}

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
		}: {
			arrangeSnapshot: (o?: object) => void;
			arrangeAuth: (o?: object) => Promise<void>;
			wsConnect: (o?: object) => Promise<void>;
		},
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
		wsConnect
	}) => {
		const createRound = new CreateRoundPage(page);
		await arrangeRoundCreateSession(
			{ arrangeSnapshot, arrangeAuth, wsConnect },
			'player',
			'/rounds'
		);

		await expect(createRound.createRouteButton()).toBeVisible();
		await expect(createRound.createRouteButton()).toHaveAttribute('href', '/rounds/create');
		await page.goto('/rounds/create');
		await expect.poll(() => new URL(page.url()).pathname).toBe('/rounds/create');
		await expect(createRound.createPage()).toBeVisible();

		await createRound.fillForm({
			title: 'PWA Created Round',
			description: 'Testing web create flow',
			startTime: '2026-02-24 18:30',
			timezone: 'America/Chicago',
			location: 'Pier Park'
		});
		await createRound.submit();

		await expect.poll(() => new URL(page.url()).pathname).toBe('/rounds');
		await expect.poll(() => new URL(page.url()).search).toContain('created=requested');
		await expect(page.getByRole('status')).toContainText('Round creation requested');
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
		await expect.poll(() => new URL(page.url()).pathname).toBe('/rounds');
	});

	test('deep-links challenge scheduling into create-round and returns to the challenge detail route', async ({
		page,
		arrangeSnapshot,
		wsStubRequest,
		arrangeAuth,
		wsConnect
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
		await seedChallengeStore(page, { board: [acceptedChallenge], detail: acceptedChallenge });

		const createRoundLink = page
			.locator(`[data-testid="challenge-card-${challengeId}"]`)
			.getByRole('link', { name: 'Create Round' });
		await expect(createRoundLink).toHaveAttribute(
			'href',
			`/rounds/create?challenge=${challengeId}`
		);
		await page.goto(`/rounds/create?challenge=${challengeId}`);
		await expect.poll(() => new URL(page.url()).pathname).toBe('/rounds/create');
		expect(new URL(page.url()).search).toContain(`challenge=${challengeId}`);
		await expect(
			page.getByText(
				'This round will be linked to an accepted challenge after the round is created.'
			)
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

		await expect.poll(() => new URL(page.url()).pathname).toBe(`/challenges/${challengeId}`);
		await expect.poll(() => new URL(page.url()).search).toContain('created=requested');
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
		wsConnect
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
		await seedChallengeStore(page, { board: [acceptedChallenge], detail: acceptedChallenge });

		const createRoundLink = page
			.locator(`[data-testid="challenge-card-${challengeId}"]`)
			.getByRole('link', { name: 'Create Round' });
		await expect(createRoundLink).toHaveAttribute(
			'href',
			`/rounds/create?challenge=${challengeId}`
		);
		await page.goto(`/rounds/create?challenge=${challengeId}`);
		await expect.poll(() => new URL(page.url()).pathname).toBe('/rounds/create');
		expect(new URL(page.url()).search).toContain(`challenge=${challengeId}`);

		await createRound.fillForm({
			title: 'Club Scoped Challenge Match',
			description: 'Created without a discord guild mapping',
			startTime: '2026-03-15 16:00',
			timezone: 'America/New_York',
			location: 'Pier Park'
		});
		await createRound.submit();

		await expect.poll(() => new URL(page.url()).pathname).toBe(`/challenges/${challengeId}`);
		await expect.poll(() => new URL(page.url()).search).toContain('created=requested');
	});
});
