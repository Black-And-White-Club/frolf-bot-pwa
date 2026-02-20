/**
 * Admin Store
 * Handles administrative operations: batch tag assignment and manual point adjustment.
 * Uses NATS pub/sub (fire-and-forget) to match how Discord bot triggers the same handlers.
 */

import { nats } from './nats.svelte';
import { dataLoader } from './dataLoader.svelte';

interface TagAssignment {
	userId: string;
	tagNumber: number; // 0 = remove tag
}

interface BatchTagPayload {
	guild_id: string;
	requester_user_id: string;
	batch_id: string;
	assignments: Array<{ user_id: string; tag_number: number }>;
	source: string;
}

interface PointAdjustPayload {
	guild_id: string;
	member_id: string;
	points_delta: number;
	reason: string;
	admin_id: string;
}

const OPERATION_TIMEOUT_MS = 10_000;
const MESSAGE_CLEAR_MS = 5_000;

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

		let resolved = false;

		const cleanup = () => {
			nats.unsubscribe(successTopic);
			nats.unsubscribe(failureTopic);
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

		let resolved = false;

		const cleanup = () => {
			nats.unsubscribe(successTopic);
			nats.unsubscribe(failureTopic);
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
	}
}

export const adminStore = new AdminService();
