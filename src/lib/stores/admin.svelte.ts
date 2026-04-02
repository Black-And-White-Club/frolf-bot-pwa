/**
 * Admin Store
 * Handles administrative operations: batch tag assignment and manual point adjustment.
 * Uses NATS pub/sub (fire-and-forget) to match how Discord bot triggers the same handlers.
 */

import { nats } from './nats.svelte';
import { dataLoader } from './dataLoader.svelte';

type TagAssignment = {
	userId: string;
	tagNumber: number; // 0 = remove tag
};

type BatchTagPayload = {
	guild_id: string;
	requesting_user_id: string;
	batch_id: string;
	assignments: Array<{ user_id: string; tag_number: number }>;
	source: string;
};

type PointAdjustPayload = {
	guild_id: string;
	member_id: string;
	points_delta: number;
	reason: string;
	admin_id: string;
};

type BettingWalletAdjustPayload = {
	club_uuid: string;
	member_id: string;
	amount: number;
	reason: string;
};

type BettingMarketActionPayload = {
	club_uuid: string;
	market_id: number;
	action: 'void' | 'resettle';
	reason: string;
};

export type AdminBettingMarket = {
	id: number;
	round_id: string;
	round_title: string;
	market_type: string;
	title: string;
	status: string;
	locks_at: string;
	settled_at: string | null;
	result_summary: string;
	settlement_version: number;
	ticket_count: number;
	exposure: number;
	accepted_tickets: number;
	won_tickets: number;
	lost_tickets: number;
	voided_tickets: number;
};

type AdminBettingMarketsResponse = {
	markets: AdminBettingMarket[];
};

type AdminScorecardUploadInput = {
	guildId: string;
	userId: string;
	roundId: string;
	eventMessageId?: string;
	file: File;
	notes?: string;
};

export type AdminBackfillCheckResult = {
	subsequent_round_count: number;
	round_titles: string[];
};

export type AdminBackfillRoundInput = {
	guildId: string;
	adminId: string;
	title: string;
	location: string;
	startTime: Date;
	mode: string;
	file: File;
	notes?: string;
};

type AdminScorecardUploadPayload = {
	guild_id: string;
	round_id: string;
	import_id: string;
	source: string;
	user_id: string;
	channel_id: string;
	message_id: string;
	file_data: string;
	file_name: string;
	notes: string;
	allow_guest_players: boolean;
	overwrite_existing_scores: boolean;
	timestamp: string;
};

const OPERATION_TIMEOUT_MS = 10_000;
const MESSAGE_CLEAR_MS = 5_000;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(['csv', 'xlsx']);
const ADMIN_SCORECARD_UPLOAD_SUBJECT = 'round.scorecard.admin.upload.requested.v2';
const ADMIN_SCORECARD_UPLOAD_SOURCE = 'admin_pwa_upload';
const ADMIN_BACKFILL_CHECK_SUBJECT = 'round.admin.backfill.check.v1';
const ADMIN_BACKFILL_REQUESTED_SUBJECT = 'round.admin.backfill.requested.v1';
const ADMIN_UDISC_IDENTITY_UPDATE_SUBJECT = 'user.udisc.identity.update.requested.v1';
const ADMIN_UDISC_IDENTITY_UPDATED_SUBJECT = 'user.udisc.identity.updated.v1';
const ADMIN_UDISC_IDENTITY_FAILED_SUBJECT = 'user.udisc.identity.update.failed.v1';
const ADMIN_ROUND_EMBED_REPUBLISH_SUBJECT = 'round.admin.republish.embed.requested.v1';
const LEADERBOARD_RECALCULATE_SUBJECT = 'leaderboard.recalculate.round.v1';
const LEADERBOARD_RECALCULATE_SUCCESS = 'leaderboard.recalculate.round.success.v1';
const LEADERBOARD_RECALCULATE_FAILED = 'leaderboard.recalculate.round.failed.v1';

class AdminService {
	loading = $state(false);
	bettingMarketsLoading = $state(false);
	successMessage = $state<string | null>(null);
	errorMessage = $state<string | null>(null);
	bettingMarkets = $state<AdminBettingMarket[]>([]);

	private clearTimer: ReturnType<typeof setTimeout> | null = null;

	private scheduleMessageClear() {
		if (this.clearTimer) clearTimeout(this.clearTimer);
		this.clearTimer = setTimeout(() => {
			this.successMessage = null;
			this.errorMessage = null;
		}, MESSAGE_CLEAR_MS);
	}

	/**
	 * Submit a batch of tag assignments.
	 * Publishes to leaderboard.batch.tag.assignment.requested.v2 (no guildId suffix — backend subscribes without it)
	 * and subscribes for success/failure feedback.
	 *
	 * @param guildId - Club UUID or Discord Guild ID (used only in the payload guild_id field, not the subject)
	 * @param adminId - Discord ID of the admin performing the operation
	 * @param assignments - Array of {userId, tagNumber} (tagNumber=0 removes the tag)
	 */
	async submitTagAssignments(
		guildId: string,
		adminId: string,
		assignments: TagAssignment[]
	): Promise<void> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		const batchId = crypto.randomUUID();
		// Backend publishes success/failure without guildId suffix — filter by batch_id instead
		const successTopic = 'leaderboard.batch.tag.assigned.v2';
		const failureTopic = 'leaderboard.batch.tag.assignment.failed.v2';

		return new Promise((resolve) => {
			let resolved = false;

			const cleanup = () => {
				nats.unsubscribe(successTopic);
				nats.unsubscribe(failureTopic);
				resolve();
			};

			nats.subscribe(successTopic, (msg: any) => {
				if (resolved) return;
				// Filter by batch_id if present in response
				if (msg.data.batch_id && msg.data.batch_id !== batchId) return;
				resolved = true;
				this.loading = false;
				const count = msg.data.assignment_count ?? assignments.length;
				this.successMessage = `Tags updated successfully (${count} assignment${count !== 1 ? 's' : ''})`;
				this.scheduleMessageClear();
				dataLoader.reload();
				cleanup();
			});

			nats.subscribe(failureTopic, (msg: any) => {
				if (resolved) return;
				if (msg.data.batch_id && msg.data.batch_id !== batchId) return;
				resolved = true;
				this.loading = false;
				this.errorMessage = msg.data.reason ?? 'Tag assignment failed';
				this.scheduleMessageClear();
				cleanup();
			});

			const payload: BatchTagPayload = {
				guild_id: guildId,
				requesting_user_id: adminId,
				batch_id: batchId,
				assignments: assignments.map((a) => ({ user_id: a.userId, tag_number: a.tagNumber })),
				source: 'admin_batch'
			};

			nats.publish('leaderboard.batch.tag.assignment.requested.v2', payload);

			setTimeout(() => {
				if (!resolved) {
					resolved = true;
					this.loading = false;
					this.errorMessage = 'Request timed out. Please verify results manually.';
					this.scheduleMessageClear();
					cleanup();
				}
			}, OPERATION_TIMEOUT_MS);
		});
	}

	/**
	 * Submit a manual point adjustment for a player.
	 * Publishes to leaderboard.manual.point.adjustment.v2 (no guildId suffix — backend subscribes without it)
	 * and subscribes for success/failure feedback.
	 *
	 * @param guildId - Club UUID or Discord Guild ID
	 * @param adminId - Discord ID of the admin
	 * @param memberId - Discord ID of the player to adjust
	 * @param delta - Point delta (positive or negative)
	 * @param reason - Required reason for the adjustment
	 */
	async adjustPoints(
		guildId: string,
		adminId: string,
		memberId: string,
		delta: number,
		reason: string
	): Promise<void> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		// Backend publishes without guildId suffix — guild is scoped by payload.guild_id
		const successTopic = 'leaderboard.manual.point.adjustment.success.v2';
		const failureTopic = 'leaderboard.manual.point.adjustment.failed.v2';

		return new Promise((resolve) => {
			let resolved = false;

			const cleanup = () => {
				nats.unsubscribe(successTopic);
				nats.unsubscribe(failureTopic);
				resolve();
			};

			nats.subscribe(successTopic, (msg: any) => {
				if (resolved) return;
				resolved = true;
				this.loading = false;
				const sign = delta > 0 ? '+' : '';
				this.successMessage = `Points adjusted: ${sign}${delta} (${msg.data.reason ?? reason})`;
				this.scheduleMessageClear();
				cleanup();
			});

			nats.subscribe(failureTopic, (msg: any) => {
				if (resolved) return;
				resolved = true;
				this.loading = false;
				this.errorMessage = msg.data.reason ?? 'Point adjustment failed';
				this.scheduleMessageClear();
				cleanup();
			});

			const payload: PointAdjustPayload = {
				guild_id: guildId,
				member_id: memberId,
				points_delta: delta,
				reason,
				admin_id: adminId
			};

			nats.publish('leaderboard.manual.point.adjustment.v2', payload);

			setTimeout(() => {
				if (!resolved) {
					resolved = true;
					this.loading = false;
					this.errorMessage = 'Request timed out. Please verify results manually.';
					this.scheduleMessageClear();
					cleanup();
				}
			}, OPERATION_TIMEOUT_MS);
		});
	}

	async adjustBettingWallet(
		clubUuid: string,
		memberId: string,
		amount: number,
		reason: string
	): Promise<void> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		const payload: BettingWalletAdjustPayload = {
			club_uuid: clubUuid,
			member_id: memberId,
			amount,
			reason
		};

		try {
			const res = await fetch('/api/betting/admin/wallet-adjustments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const data = (await res.json().catch(() => null)) as {
				amount?: number;
				reason?: string;
				error?: string;
			} | null;

			if (!res.ok) {
				this.errorMessage = data?.error ?? 'Betting wallet adjustment failed';
				this.scheduleMessageClear();
				return;
			}

			const sign = amount > 0 ? '+' : '';
			this.successMessage = `Betting wallet adjusted: ${sign}${amount} (${data?.reason ?? reason})`;
			this.scheduleMessageClear();
		} catch {
			this.errorMessage = 'Betting wallet adjustment failed';
			this.scheduleMessageClear();
		} finally {
			this.loading = false;
		}
	}

	async loadBettingMarkets(clubUuid: string): Promise<void> {
		if (!clubUuid) {
			this.bettingMarkets = [];
			return;
		}

		this.bettingMarketsLoading = true;
		this.errorMessage = null;

		try {
			const res = await fetch(
				`/api/betting/admin/markets?club_uuid=${encodeURIComponent(clubUuid)}`,
				{
					headers: {
						Accept: 'application/json'
					}
				}
			);

			const data = (await res.json().catch(() => null)) as
				| (AdminBettingMarketsResponse & { error?: string })
				| null;

			if (!res.ok) {
				this.errorMessage = data?.error ?? 'Failed to load betting markets';
				this.scheduleMessageClear();
				return;
			}

			this.bettingMarkets = data?.markets ?? [];
		} catch {
			this.errorMessage = 'Failed to load betting markets';
			this.scheduleMessageClear();
		} finally {
			this.bettingMarketsLoading = false;
		}
	}

	async applyBettingMarketAction(
		clubUuid: string,
		marketId: number,
		action: 'void' | 'resettle',
		reason: string
	): Promise<boolean> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		const payload: BettingMarketActionPayload = {
			club_uuid: clubUuid,
			market_id: marketId,
			action,
			reason
		};

		try {
			const res = await fetch('/api/betting/admin/market-actions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const data = (await res.json().catch(() => null)) as {
				result_summary?: string;
				error?: string;
			} | null;

			if (!res.ok) {
				this.errorMessage = data?.error ?? 'Betting market action failed';
				this.scheduleMessageClear();
				return false;
			}

			this.successMessage =
				action === 'void'
					? `Market voided. ${data?.result_summary ?? ''}`.trim()
					: `Market resettled. ${data?.result_summary ?? ''}`.trim();
			this.scheduleMessageClear();
			await this.loadBettingMarkets(clubUuid);
			return true;
		} catch {
			this.errorMessage = 'Betting market action failed';
			this.scheduleMessageClear();
			return false;
		} finally {
			this.loading = false;
		}
	}

	private toBase64(data: Uint8Array): string {
		let binary = '';
		const chunkSize = 0x8000;
		for (let i = 0; i < data.length; i += chunkSize) {
			const chunk = data.subarray(i, i + chunkSize);
			binary += String.fromCharCode(...chunk);
		}
		return btoa(binary);
	}

	private getExtension(name: string): string {
		const parts = name.toLowerCase().split('.');
		return parts.length > 1 ? parts[parts.length - 1] : '';
	}

	private validateScorecardFile(file: File): void {
		if (file.size === 0) {
			throw new Error('Scorecard file is empty');
		}
		if (file.size > MAX_UPLOAD_BYTES) {
			throw new Error('Scorecard exceeds the 10MB upload limit');
		}

		const extension = this.getExtension(file.name);
		if (!SUPPORTED_EXTENSIONS.has(extension)) {
			throw new Error('Only .csv and .xlsx files are supported');
		}
	}

	private validateScorecardUploadInput(
		guildId: string,
		userId: string,
		roundId: string,
		file: File | null | undefined
	): asserts file is File {
		if (!guildId || !userId || !roundId) {
			throw new Error('Guild, user, and round are required');
		}
		if (!file) {
			throw new Error('Scorecard file is required');
		}

		this.validateScorecardFile(file);
	}

	private async buildScorecardUploadPayload(
		guildId: string,
		userId: string,
		roundId: string,
		eventMessageId: string,
		file: File,
		notes: string
	): Promise<AdminScorecardUploadPayload> {
		const bytes = new Uint8Array(await file.arrayBuffer());

		return {
			guild_id: guildId,
			round_id: roundId,
			import_id: crypto.randomUUID(),
			source: ADMIN_SCORECARD_UPLOAD_SOURCE,
			user_id: userId,
			channel_id: '',
			message_id: eventMessageId,
			file_data: this.toBase64(bytes),
			file_name: file.name,
			notes: notes.trim(),
			allow_guest_players: true,
			overwrite_existing_scores: true,
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * Pre-check: returns count and titles of finalized rounds after the given date.
	 * Uses NATS request-reply.
	 */
	async backfillCheck(
		guildId: string,
		adminId: string,
		startTime: Date
	): Promise<AdminBackfillCheckResult | null> {
		try {
			const result = await nats.request<
				{ guild_id: string; admin_id: string; start_time: string },
				AdminBackfillCheckResult
			>(
				ADMIN_BACKFILL_CHECK_SUBJECT,
				{ guild_id: guildId, admin_id: adminId, start_time: startTime.toISOString() },
				{ timeout: OPERATION_TIMEOUT_MS }
			);
			return result;
		} catch {
			return null;
		}
	}

	/**
	 * Submit a backfill round creation + import.
	 * Uses request-reply so backend receipt is confirmed before showing success.
	 * The import pipeline runs asynchronously after the ack.
	 */
	async backfillRound({
		guildId,
		adminId,
		title,
		location,
		startTime,
		mode,
		file,
		notes = ''
	}: AdminBackfillRoundInput): Promise<void> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		try {
			this.validateScorecardFile(file);

			const bytes = new Uint8Array(await file.arrayBuffer());
			const payload = {
				guild_id: guildId,
				admin_id: adminId,
				title,
				location,
				start_time: startTime.toISOString(),
				mode,
				file_data: this.toBase64(bytes),
				file_name: file.name,
				notes: notes.trim(),
				import_id: crypto.randomUUID()
			};

			const response = await nats.request<typeof payload, { round_id: string; error?: string }>(
				ADMIN_BACKFILL_REQUESTED_SUBJECT,
				payload,
				{ timeout: OPERATION_TIMEOUT_MS }
			);

			if (response?.error) {
				throw new Error(response.error);
			}

			this.successMessage =
				'Backfill round received. Import is processing — check Discord for the finalized embed.';
			this.scheduleMessageClear();
		} catch (error) {
			this.errorMessage =
				error instanceof Error ? error.message : 'Failed to submit backfill round';
			this.scheduleMessageClear();
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Set UDisc username and/or display name for any user.
	 * Publishes user.udisc.identity.update.requested.v1 and waits for success/failure.
	 */
	async updateUDiscIdentity(
		guildId: string,
		targetUserId: string,
		username?: string,
		name?: string
	): Promise<void> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		return new Promise((resolve) => {
			let resolved = false;

			const cleanup = () => {
				nats.unsubscribe(ADMIN_UDISC_IDENTITY_UPDATED_SUBJECT);
				nats.unsubscribe(ADMIN_UDISC_IDENTITY_FAILED_SUBJECT);
				resolve();
			};

			nats.subscribe(ADMIN_UDISC_IDENTITY_UPDATED_SUBJECT, (msg: any) => {
				if (resolved) return;
				if (msg.data.user_id && msg.data.user_id !== targetUserId) return;
				resolved = true;
				this.loading = false;
				this.successMessage = 'UDisc identity updated successfully.';
				this.scheduleMessageClear();
				cleanup();
			});

			nats.subscribe(ADMIN_UDISC_IDENTITY_FAILED_SUBJECT, (msg: any) => {
				if (resolved) return;
				if (msg.data.user_id && msg.data.user_id !== targetUserId) return;
				resolved = true;
				this.loading = false;
				this.errorMessage = msg.data.reason ?? 'UDisc identity update failed';
				this.scheduleMessageClear();
				cleanup();
			});

			const payload: Record<string, unknown> = {
				guild_id: guildId,
				user_id: targetUserId
			};
			if (username !== undefined && username !== '') payload.username = username;
			if (name !== undefined && name !== '') payload.name = name;

			nats.publish(ADMIN_UDISC_IDENTITY_UPDATE_SUBJECT, payload);

			setTimeout(() => {
				if (!resolved) {
					resolved = true;
					this.loading = false;
					this.errorMessage = 'Request timed out. Please verify results manually.';
					this.scheduleMessageClear();
					cleanup();
				}
			}, OPERATION_TIMEOUT_MS);
		});
	}

	/**
	 * Re-publish the finalized Discord embed for a round.
	 * Uses NATS request-reply so the backend confirms receipt before returning.
	 */
	async republishRoundEmbed(
		guildId: string,
		adminId: string,
		roundId: string
	): Promise<void> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		try {
			const response = await nats.request<
				{ guild_id: string; round_id: string; admin_id: string },
				{ round_id: string; error?: string }
			>(
				ADMIN_ROUND_EMBED_REPUBLISH_SUBJECT,
				{ guild_id: guildId, round_id: roundId, admin_id: adminId },
				{ timeout: OPERATION_TIMEOUT_MS }
			);

			if (response?.error) {
				throw new Error(response.error);
			}

			this.successMessage = 'Embed republish triggered. Discord message should update shortly.';
			this.scheduleMessageClear();
		} catch (error) {
			this.errorMessage =
				error instanceof Error ? error.message : 'Failed to republish round embed';
			this.scheduleMessageClear();
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Trigger recalculation of points and tag swaps for a finalized round.
	 * Publishes leaderboard.recalculate.round.v1 and waits for success/failure.
	 */
	async recalculateRound(guildId: string, roundId: string): Promise<void> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		return new Promise((resolve) => {
			let resolved = false;

			const cleanup = () => {
				nats.unsubscribe(LEADERBOARD_RECALCULATE_SUCCESS);
				nats.unsubscribe(LEADERBOARD_RECALCULATE_FAILED);
				resolve();
			};

			nats.subscribe(LEADERBOARD_RECALCULATE_SUCCESS, (msg: any) => {
				if (resolved) return;
				if (msg.data.round_id && msg.data.round_id !== roundId) return;
				resolved = true;
				this.loading = false;
				const count = msg.data.points_awarded ? Object.keys(msg.data.points_awarded).length : 0;
				this.successMessage = `Points recalculated successfully (${count} player${count !== 1 ? 's' : ''})`;
				this.scheduleMessageClear();
				cleanup();
			});

			nats.subscribe(LEADERBOARD_RECALCULATE_FAILED, (msg: any) => {
				if (resolved) return;
				if (msg.data.round_id && msg.data.round_id !== roundId) return;
				resolved = true;
				this.loading = false;
				this.errorMessage = msg.data.reason ?? 'Recalculation failed';
				this.scheduleMessageClear();
				cleanup();
			});

			nats.publish(LEADERBOARD_RECALCULATE_SUBJECT, {
				guild_id: guildId,
				round_id: roundId
			});

			setTimeout(() => {
				if (!resolved) {
					resolved = true;
					this.loading = false;
					this.errorMessage = 'Request timed out. Please verify results manually.';
					this.scheduleMessageClear();
					cleanup();
				}
			}, OPERATION_TIMEOUT_MS);
		});
	}

	async uploadScorecard({
		guildId,
		userId,
		roundId,
		eventMessageId = '',
		file,
		notes = ''
	}: AdminScorecardUploadInput): Promise<void> {
		this.loading = true;
		this.successMessage = null;
		this.errorMessage = null;

		try {
			this.validateScorecardUploadInput(guildId, userId, roundId, file);

			const payload = await this.buildScorecardUploadPayload(
				guildId,
				userId,
				roundId,
				eventMessageId,
				file,
				notes
			);

			nats.publish(ADMIN_SCORECARD_UPLOAD_SUBJECT, payload);
			this.successMessage = 'Scorecard upload queued. Import processing has started.';
			this.scheduleMessageClear();
		} catch (error) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to upload scorecard';
			this.scheduleMessageClear();
		} finally {
			this.loading = false;
		}
	}
}

export const adminStore = new AdminService();
