import { test, expect } from '../fixtures';
import {
	buildLeaderboardSnapshot,
	buildRoundListSnapshot,
	buildTagListSnapshot
} from '../support/event-builders';

test.describe('Challenges Routes', () => {
	const subjectId = 'club-123';
	const guildId = 'guild-123';

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
						unlinkedAt: optStr(l.unlinked_at),
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
							completedAt:
								typeof rawDetail.completed_at === 'string' ? rawDetail.completed_at : null,
							hiddenAt: typeof rawDetail.hidden_at === 'string' ? rawDetail.hidden_at : null,
							hiddenByUserUuid:
								typeof rawDetail.hidden_by_user_uuid === 'string'
									? rawDetail.hidden_by_user_uuid
									: null,
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
		await seedChallengeStore(page, { board: [openChallenge, acceptedChallenge] });

		await expect(page.locator('[data-testid="challenges-page"]')).toBeVisible();
		await expect(page.locator('[data-testid="challenge-board"]')).toBeVisible();
		await expect(page.locator('[data-testid="challenge-card-challenge-open"]')).toBeVisible();

		const viewLink = page
			.locator('[data-testid="challenge-card-challenge-open"]')
			.getByRole('link', { name: 'View challenge' });
		await expect(viewLink).toHaveAttribute('href', '/challenges/challenge-open');
		await viewLink.click();

		await expect.poll(() => new URL(page.url()).pathname).toBe('/challenges/challenge-open');
		await expect(page.locator('[data-testid="challenge-detail-page"]')).toBeVisible();
	});

	test('loads archived challenges on the detail route even when they are not board-visible', async ({
		page,
		arrangeSnapshot,
		wsStubRequest,
		arrangeAuth,
		wsConnect
	}) => {
		const completedChallenge = buildChallenge({
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
		});
		await arrangeChallengeSession(
			{ arrangeSnapshot, wsStubRequest, arrangeAuth, wsConnect },
			'/challenges/challenge-completed',
			{ challenges: [buildChallenge({ id: 'challenge-open' })] },
			{ challenge: completedChallenge }
		);
		await seedChallengeStore(page, { detail: completedChallenge });

		await expect(page.locator('[data-testid="challenge-detail-page"]')).toBeVisible();

		const card = page.locator('[data-testid="challenge-card-challenge-completed"]');
		await expect(card).toHaveAttribute('data-challenge-status', 'completed');
		await expect(card).toContainText('Completed');
		await expect(page.getByRole('link', { name: 'round-55' })).toBeVisible();
		await expect(page.getByText('Completed').first()).toBeVisible();
	});
});
