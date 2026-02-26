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
	requester_user_id: string;
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

type AdminScorecardUploadInput = {
	guildId: string;
	userId: string;
	roundId: string;
	eventMessageId?: string;
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
const ADMIN_SCORECARD_UPLOAD_SUBJECT = 'round.scorecard.admin.upload.requested.v1';
const ADMIN_SCORECARD_UPLOAD_SOURCE = 'admin_pwa_upload';

class AdminService {
	loading = $state(false);
	successMessage = $state<string | null>(null);
	errorMessage = $state<string | null>(null);

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
	 * Publishes to leaderboard.batch.tag.assignment.requested.v1 (no guildId suffix — backend subscribes without it)
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
		const successTopic = 'leaderboard.batch.tag.assigned.v1';
		const failureTopic = 'leaderboard.batch.tag.assignment.failed.v1';

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
				requester_user_id: adminId,
				batch_id: batchId,
				assignments: assignments.map((a) => ({ user_id: a.userId, tag_number: a.tagNumber })),
				source: 'admin_batch'
			};

			nats.publish('leaderboard.batch.tag.assignment.requested.v1', payload);

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
	 * Publishes to leaderboard.manual.point.adjustment.v1 (no guildId suffix — backend subscribes without it)
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
		const successTopic = 'leaderboard.manual.point.adjustment.success.v1';
		const failureTopic = 'leaderboard.manual.point.adjustment.failed.v1';

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

			nats.publish('leaderboard.manual.point.adjustment.v1', payload);

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

		return new Promise(async (resolve) => {
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
				resolve();
			}
		});
	}
}

export const adminStore = new AdminService();
