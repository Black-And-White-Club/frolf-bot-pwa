import { test, expect } from '../fixtures';
import { AdminPage } from '../pages/admin.page';
import {
	buildLeaderboardSnapshot,
	buildRoundCreated,
	buildTagListSnapshot
} from '../support/event-builders';
import { expectDashboardLoaded } from '../support/helpers';

test.describe('Admin Dashboard', () => {
	const subjectId = 'club-123';
	const guildId = 'guild-123';

	const profiles = {
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
	};
	const tagMembers = [
		{ member_id: 'user-1', current_tag: 1 },
		{ member_id: 'user-2', current_tag: 2 }
	];

	async function installAdminNatsBridge(page: import('@playwright/test').Page): Promise<void> {
		await page.evaluate(
			async ({ guildId, members, profiles }) => {
				const win = window as typeof window & {
					__adminPublished?: Array<{ subject: string; payload: unknown }>;
					__adminSubscribers?: Record<
						string,
						Array<(msg: { subject: string; data: unknown }) => void>
					>;
					__adminRequestStubs?: Record<string, unknown>;
				};
				win.__adminPublished = [];
				win.__adminSubscribers = {};
				win.__adminRequestStubs = {};

				const { nats } = await import('/src/lib/stores/nats.svelte.ts');
				const { tagStore } = await import('/src/lib/stores/tags.svelte.ts');
				const { userProfiles } = await import('/src/lib/stores/userProfiles.svelte.ts');

				userProfiles.setProfilesFromApi(profiles);
				tagStore.applyTagListResponse({ guild_id: guildId, members });

				nats.status = 'connected';
				nats.publish = (subject: string, payload: unknown) => {
					win.__adminPublished?.push({ subject, payload });
				};
				nats.request = async (subject: string, payload: unknown) => {
					win.__adminPublished?.push({ subject, payload });
					return win.__adminRequestStubs?.[subject] ?? null;
				};
				nats.subscribe = (
					subject: string,
					handler: (msg: { subject: string; data: unknown }) => void
				) => {
					const handlers = win.__adminSubscribers?.[subject] ?? [];
					handlers.push(handler);
					if (win.__adminSubscribers) {
						win.__adminSubscribers[subject] = handlers;
					}
					return () => {
						if (!win.__adminSubscribers?.[subject]) return;
						win.__adminSubscribers[subject] = win.__adminSubscribers[subject].filter(
							(existing) => existing !== handler
						);
					};
				};
				nats.unsubscribe = (subject: string) => {
					if (win.__adminSubscribers) {
						delete win.__adminSubscribers[subject];
					}
				};
			},
			{ guildId, members: tagMembers, profiles }
		);
	}

	async function getAdminPublished(
		page: import('@playwright/test').Page,
		subject: string
	): Promise<Array<{ subject: string; payload: unknown }>> {
		return await page.evaluate((requestedSubject) => {
			const win = window as typeof window & {
				__adminPublished?: Array<{ subject: string; payload: unknown }>;
			};
			return (win.__adminPublished ?? []).filter((entry) => entry.subject === requestedSubject);
		}, subject);
	}

	async function emitAdminEvent(
		page: import('@playwright/test').Page,
		subject: string,
		payload: unknown
	): Promise<void> {
		await page.evaluate(
			({ eventSubject, eventPayload }) => {
				const win = window as typeof window & {
					__adminSubscribers?: Record<
						string,
						Array<(msg: { subject: string; data: unknown }) => void>
					>;
				};
				for (const handler of win.__adminSubscribers?.[eventSubject] ?? []) {
					handler({ subject: eventSubject, data: eventPayload });
				}
			},
			{ eventSubject: subject, eventPayload: payload }
		);
	}

	async function stubAdminRequest(
		page: import('@playwright/test').Page,
		subject: string,
		payload: unknown
	): Promise<void> {
		await page.evaluate(
			({ requestSubject, responsePayload }) => {
				const win = window as typeof window & {
					__adminRequestStubs?: Record<string, unknown>;
				};
				if (!win.__adminRequestStubs) {
					win.__adminRequestStubs = {};
				}
				win.__adminRequestStubs[requestSubject] = responsePayload;
			},
			{ requestSubject: subject, responsePayload: payload }
		);
	}

	async function visitAdmin(
		{
			page,
			arrangeSnapshot,
			arrangeAuth,
			wsConnect
		}: {
			page: import('@playwright/test').Page;
			arrangeSnapshot: (o?: object) => void;
			arrangeAuth: (o?: object) => Promise<void>;
			wsConnect: () => Promise<void>;
		},
		role: 'viewer' | 'player' | 'editor' | 'admin' = 'admin'
	) {
		arrangeSnapshot({
			subjectId,
			rounds: [
				buildRoundCreated({
					id: 'round-admin-1',
					guild_id: guildId,
					title: 'Admin Round',
					participants: []
				})
			],
			leaderboard: buildLeaderboardSnapshot({
				guild_id: guildId,
				leaderboard: [
					{ user_id: 'user-1', tag_number: 1, total_points: 500, rounds_played: 8 },
					{ user_id: 'user-2', tag_number: 2, total_points: 450, rounds_played: 7 }
				]
			}),
			tags: buildTagListSnapshot({
				guild_id: guildId,
				members: tagMembers
			}),
			profiles
		});
		await arrangeAuth({
			path: '/admin',
			clubUuid: subjectId,
			guildId,
			role,
			linkedProviders: ['discord']
		});
		await wsConnect();

		if (role === 'admin') {
			await installAdminNatsBridge(page);
		}
	}

	test('redirects non-admin users away from /admin', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'player');

		await expect.poll(() => new URL(page.url()).pathname).toBe('/');
		await expectDashboardLoaded(page);
	});

	test('renders admin dashboard sections for admin users', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const admin = new AdminPage(page);
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		await expect(admin.root()).toBeVisible();
		await expect(admin.tagSection()).toContainText('Submit Batch');
		await expect(admin.pointSection()).toContainText('Adjust Points');
	});

	test('blocks batch submit when duplicate target tags create conflicts', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const admin = new AdminPage(page);
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		await admin.setTagForPlayer('Player One', '7');
		await admin.setTagForPlayer('Player Two', '7');

		await expect(page.getByText('#7 is already assigned to another row').first()).toBeVisible();
		await expect(admin.submitBatchButton()).toBeDisabled();
	});

	test('submits tag batch and handles success events', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const admin = new AdminPage(page);
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		await admin.setTagForPlayer('Player One', '3');
		await expect(admin.submitBatchButton()).toBeEnabled();
		await admin.submitBatchButton().click();

		const entries = await getAdminPublished(page, 'leaderboard.batch.tag.assignment.requested.v2');
		const lastEntry = entries[entries.length - 1];
		const payload = lastEntry.payload as {
			batch_id: string;
			requesting_user_id: string;
			guild_id: string;
		};

		await emitAdminEvent(page, 'leaderboard.batch.tag.assigned.v2', {
			assignment_count: 1,
			batch_id: payload.batch_id,
			guild_id: payload.guild_id,
			requesting_user_id: payload.requesting_user_id,
			assignments: [
				{
					guild_id: payload.guild_id,
					user_id: 'user-1',
					tag_number: 3
				}
			]
		});

		await expect(page.getByText('Tags updated successfully').first()).toBeVisible();
	});

	test('shows tag batch failure messages from backend events', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const admin = new AdminPage(page);
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		await admin.setTagForPlayer('Player Two', '4');
		await expect(admin.submitBatchButton()).toBeEnabled();
		await admin.submitBatchButton().click();

		const entries = await getAdminPublished(page, 'leaderboard.batch.tag.assignment.requested.v2');
		const lastEntry = entries[entries.length - 1];
		const payload = lastEntry.payload as {
			batch_id: string;
			requesting_user_id: string;
			guild_id: string;
		};

		await emitAdminEvent(page, 'leaderboard.batch.tag.assignment.failed.v2', {
			batch_id: payload.batch_id,
			guild_id: payload.guild_id,
			requesting_user_id: payload.requesting_user_id,
			reason: 'Tag number reserved'
		});

		await expect(page.getByText('Tag number reserved').first()).toBeVisible();
	});

	test('enforces point adjustment form validation before submission', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const admin = new AdminPage(page);
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		await expect(admin.adjustPointsButton()).toBeDisabled();
		await admin.pointMemberSelect().selectOption('user-1');
		await admin.pointDeltaInput().fill('0');
		await admin.pointReasonInput().fill('Manual correction');
		await expect(admin.adjustPointsButton()).toBeDisabled();
		await expect(page.getByText('Delta cannot be zero')).toBeVisible();

		await admin.pointDeltaInput().clear();
		await admin.pointDeltaInput().fill('10');
		await expect(admin.adjustPointsButton()).not.toBeDisabled();
	});

	test('submits manual point adjustment and handles success events', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const admin = new AdminPage(page);
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		await admin.pointMemberSelect().selectOption('user-2');
		await admin.pointDeltaInput().fill('15');
		await admin.pointReasonInput().fill('Bonus points');
		await expect(admin.adjustPointsButton()).toBeEnabled();
		await admin.adjustPointsButton().click();

		const entries = await getAdminPublished(page, 'leaderboard.manual.point.adjustment.v2');
		const lastEntry = entries[entries.length - 1];
		const payload = lastEntry.payload as {
			guild_id: string;
			member_id: string;
			points_delta: number;
			reason: string;
		};

		expect(payload.guild_id).toBe(guildId);
		expect(payload.guild_id).not.toBe(subjectId);

		await emitAdminEvent(page, 'leaderboard.manual.point.adjustment.success.v2', {
			guild_id: payload.guild_id,
			member_id: payload.member_id,
			points_delta: payload.points_delta,
			reason: payload.reason
		});

		await expect(page.getByText('Points adjusted: +15').first()).toBeVisible();
	});

	test('shows manual point adjustment failures from backend events', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		const admin = new AdminPage(page);
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		await admin.pointMemberSelect().selectOption('user-1');
		await admin.pointDeltaInput().fill('-5');
		await admin.pointReasonInput().fill('Penalty');
		await expect(admin.adjustPointsButton()).toBeEnabled();
		await admin.adjustPointsButton().click();

		const entries = await getAdminPublished(page, 'leaderboard.manual.point.adjustment.v2');
		const lastEntry = entries[entries.length - 1];
		const payload = lastEntry.payload as { guild_id: string };

		expect(payload.guild_id).toBe(guildId);
		expect(payload.guild_id).not.toBe(subjectId);

		await emitAdminEvent(page, 'leaderboard.manual.point.adjustment.failed.v2', {
			guild_id: payload.guild_id,
			reason: 'Only admins can adjust points'
		});

		await expect(page.getByText('Only admins can adjust points').first()).toBeVisible();
	});

	test('submits admin scorecard upload with overwrite + guest fallback flags', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		const manualRoundId = '1bd0d342-19ef-4d25-b6a7-b537e523fb34';
		await page.locator('#admin-scorecard-round-id').fill(manualRoundId);
		await page.locator('#admin-scorecard-notes').fill('Imported from admin dashboard');
		await page.locator('#admin-scorecard-file').setInputFiles({
			name: 'scores.csv',
			mimeType: 'text/csv',
			buffer: Buffer.from('Player,+/-\nAlec,-2\n')
		});
		await page.getByRole('button', { name: 'Upload Scorecard' }).click();

		await expect
			.poll(async () => {
				const entries = await getAdminPublished(page, 'round.scorecard.admin.upload.requested.v2');
				return entries.length;
			})
			.toBeGreaterThan(0);
		const entries = await getAdminPublished(page, 'round.scorecard.admin.upload.requested.v2');
		const lastEntry = entries[entries.length - 1];
		const payload = lastEntry.payload as {
			guild_id: string;
			round_id: string;
			user_id: string;
			file_name: string;
			source: string;
			allow_guest_players: boolean;
			overwrite_existing_scores: boolean;
			notes: string;
		};

		expect(payload.guild_id).toBe(guildId);
		expect(payload.guild_id).not.toBe(subjectId);
		expect(payload.round_id).toBe(manualRoundId);
		expect(payload.file_name).toBe('scores.csv');
		expect(payload.source).toBe('admin_pwa_upload');
		expect(payload.allow_guest_players).toBe(true);
		expect(payload.overwrite_existing_scores).toBe(true);
		expect(payload.notes).toBe('Imported from admin dashboard');
	});

	test('uses the Discord guild ID for backfill check and submit when club UUID differs', async ({
		page,
		arrangeSnapshot,
		arrangeAuth,
		wsConnect
	}) => {
		await visitAdmin({ page, arrangeSnapshot, arrangeAuth, wsConnect }, 'admin');

		await stubAdminRequest(page, 'round.admin.backfill.check.v1', {
			subsequent_round_count: 0,
			round_titles: []
		});
		await stubAdminRequest(page, 'round.admin.backfill.requested.v1', {
			round_id: 'round-backfill-1'
		});

		await page.locator('#backfill-title').fill('Historic Round');
		await page.locator('#backfill-location').fill('Pier Park');
		await page.locator('#backfill-date').fill('2025-03-08T15:30');
		await page.waitForTimeout(700);

		await expect
			.poll(async () => {
				const entries = await getAdminPublished(page, 'round.admin.backfill.check.v1');
				return entries.length;
			})
			.toBeGreaterThan(0);
		const checkEntries = await getAdminPublished(page, 'round.admin.backfill.check.v1');
		const checkPayload = checkEntries[checkEntries.length - 1].payload as {
			guild_id: string;
			admin_id: string;
			start_time: string;
		};
		expect(checkPayload.guild_id).toBe(guildId);
		expect(checkPayload.guild_id).not.toBe(subjectId);
		expect(checkPayload.admin_id).toBe('user-1');
		expect(checkPayload.start_time).toContain('2025-03-08T');

		await page.locator('#backfill-file').setInputFiles({
			name: 'historic-round.csv',
			mimeType: 'text/csv',
			buffer: Buffer.from('Player,+/-\nAlec,-2\n')
		});
		await expect(page.getByRole('button', { name: 'Submit Backfill Round' })).toBeEnabled();
		await page.getByRole('button', { name: 'Submit Backfill Round' }).click();

		await expect
			.poll(async () => {
				const entries = await getAdminPublished(page, 'round.admin.backfill.requested.v1');
				return entries.length;
			})
			.toBeGreaterThan(0);
		const submitEntries = await getAdminPublished(page, 'round.admin.backfill.requested.v1');
		const submitPayload = submitEntries[submitEntries.length - 1].payload as {
			guild_id: string;
			admin_id: string;
			title: string;
			location: string;
			file_name: string;
		};
		expect(submitPayload.guild_id).toBe(guildId);
		expect(submitPayload.guild_id).not.toBe(subjectId);
		expect(submitPayload.admin_id).toBe('user-1');
		expect(submitPayload.title).toBe('Historic Round');
		expect(submitPayload.location).toBe('Pier Park');
		expect(submitPayload.file_name).toBe('historic-round.csv');
	});
});
