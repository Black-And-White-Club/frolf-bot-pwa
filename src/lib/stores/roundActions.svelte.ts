import { auth } from './auth.svelte';
import { nats } from './nats.svelte';
import { roundService } from './round.svelte';

type ParticipantResponse = 'ACCEPT' | 'DECLINE' | 'TENTATIVE';

type UpdateRoundInput = {
	title: string;
	description: string;
	startTime: string;
	timezone: string;
	location: string;
};

type ParticipantJoinRequestedPayloadV1 = {
	guild_id: string;
	round_id: string;
	user_id: string;
	response: ParticipantResponse;
};

type ParticipantRemovalRequestedPayloadV1 = {
	guild_id: string;
	round_id: string;
	user_id: string;
};

type ScoreUpdateRequestedPayloadV1 = {
	guild_id: string;
	round_id: string;
	user_id: string;
	score: number;
	channel_id: string;
	message_id: string;
};

type UpdateRoundRequestedPayloadV1 = {
	guild_id: string;
	round_id: string;
	user_id: string;
	channel_id: string;
	message_id: string;
	title?: string;
	description?: string;
	start_time?: string;
	timezone?: string;
	location?: string;
};

type DeleteRoundRequestedPayloadV1 = {
	guild_id: string;
	round_id: string;
	requesting_user_user_id: string;
};

const PARTICIPANT_JOIN_SUBJECT = 'round.participant.join.requested.v2';
const PARTICIPANT_REMOVAL_SUBJECT = 'round.participant.removal.requested.v2';
const SCORE_UPDATE_SUBJECT = 'round.score.update.requested.v2';
const ROUND_UPDATE_SUBJECT = 'round.update.requested.v2';
const ROUND_DELETE_SUBJECT = 'round.delete.requested.v2';
const ROUND_REQUEST_SOURCE = 'pwa';
const FALLBACK_TIMEZONE = 'America/Chicago';

class RoundActionsService {
	errorMessage = $state<string | null>(null);
	successMessage = $state<string | null>(null);
	private pendingByRound = $state<Record<string, string>>({});

	isPending(roundId: string): boolean {
		return Boolean(this.pendingByRound[roundId]);
	}

	clearMessages(): void {
		this.errorMessage = null;
		this.successMessage = null;
	}

	private createCorrelationId(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
		return `pwa-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
	}

	private requireAuth(): { scopeId: string; userId: string } | null {
		if (!auth.isAuthenticated || !auth.user) {
			this.errorMessage = 'Sign in is required to perform this action.';
			return null;
		}

		if (auth.activeRole === 'viewer') {
			this.errorMessage = 'Player role is required to perform this action.';
			return null;
		}

		const scopeId = auth.user.activeClubUuid?.trim() || auth.user.guildId?.trim();
		const userId = auth.user.id?.trim();

		if (!scopeId || !userId) {
			this.errorMessage = 'Club or guild identity is missing. Refresh and try again.';
			return null;
		}

		return { scopeId, userId };
	}

	private beginRoundAction(roundId: string, actionLabel: string): void {
		this.pendingByRound = {
			...this.pendingByRound,
			[roundId]: actionLabel
		};
	}

	private endRoundAction(roundId: string): void {
		const { [roundId]: _removed, ...rest } = this.pendingByRound;
		this.pendingByRound = rest;
	}

	private publish(subject: string, payload: object): void {
		const correlationId = this.createCorrelationId();
		nats.publish(subject, payload, {
			correlation_id: correlationId,
			submitted_at: new Date().toISOString(),
			source: ROUND_REQUEST_SOURCE
		});
	}

	private canManageRound(roundId: string, userId: string): boolean {
		if (auth.canEdit) {
			return true;
		}

		const round = roundService.rounds.find((entry) => entry.id === roundId);
		return round?.createdBy === userId;
	}

	private requireRoundManager(roundId: string, userId: string, action: 'edit' | 'delete'): boolean {
		if (this.canManageRound(roundId, userId)) {
			return true;
		}

		this.errorMessage = `Round creator, editor, or admin role is required to ${action} rounds.`;
		return false;
	}

	async setParticipantResponse(roundId: string, response: ParticipantResponse): Promise<boolean> {
		if (this.isPending(roundId)) {
			return false;
		}

		this.clearMessages();
		const context = this.requireAuth();
		if (!context) {
			return false;
		}

		this.beginRoundAction(roundId, 'rsvp');
		try {
			const payload: ParticipantJoinRequestedPayloadV1 = {
				guild_id: context.scopeId,
				round_id: roundId,
				user_id: context.userId,
				response
			};
			this.publish(PARTICIPANT_JOIN_SUBJECT, payload);
			this.successMessage = 'RSVP updated. It will refresh shortly.';
			return true;
		} catch (error) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to update RSVP.';
			return false;
		} finally {
			this.endRoundAction(roundId);
		}
	}

	async leaveRound(roundId: string): Promise<boolean> {
		if (this.isPending(roundId)) {
			return false;
		}

		this.clearMessages();
		const context = this.requireAuth();
		if (!context) {
			return false;
		}

		this.beginRoundAction(roundId, 'leave');
		try {
			const payload: ParticipantRemovalRequestedPayloadV1 = {
				guild_id: context.scopeId,
				round_id: roundId,
				user_id: context.userId
			};
			this.publish(PARTICIPANT_REMOVAL_SUBJECT, payload);
			this.successMessage = 'You were removed from the round.';
			return true;
		} catch (error) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to leave round.';
			return false;
		} finally {
			this.endRoundAction(roundId);
		}
	}

	async submitScore(roundId: string, score: number): Promise<boolean> {
		if (this.isPending(roundId)) {
			return false;
		}

		this.clearMessages();
		const context = this.requireAuth();
		if (!context) {
			return false;
		}

		if (!Number.isFinite(score)) {
			this.errorMessage = 'Enter a valid numeric score.';
			return false;
		}

		this.beginRoundAction(roundId, 'score');
		try {
			const payload: ScoreUpdateRequestedPayloadV1 = {
				guild_id: context.scopeId,
				round_id: roundId,
				user_id: context.userId,
				score,
				channel_id: '',
				message_id: ''
			};
			this.publish(SCORE_UPDATE_SUBJECT, payload);
			this.successMessage = 'Score submitted.';
			return true;
		} catch (error) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to submit score.';
			return false;
		} finally {
			this.endRoundAction(roundId);
		}
	}

	async updateRound(roundId: string, input: UpdateRoundInput): Promise<boolean> {
		if (this.isPending(roundId)) {
			return false;
		}

		this.clearMessages();
		const context = this.requireAuth();
		if (!context) {
			return false;
		}

		if (!this.requireRoundManager(roundId, context.userId, 'edit')) {
			return false;
		}

		this.beginRoundAction(roundId, 'update');
		try {
			const payload: UpdateRoundRequestedPayloadV1 = {
				guild_id: context.scopeId,
				round_id: roundId,
				user_id: context.userId,
				channel_id: '',
				message_id: '',
				title: input.title.trim(),
				description: input.description.trim(),
				start_time: input.startTime.trim(),
				timezone: input.timezone.trim() || FALLBACK_TIMEZONE,
				location: input.location.trim()
			};
			this.publish(ROUND_UPDATE_SUBJECT, payload);
			this.successMessage = 'Round update requested.';
			return true;
		} catch (error) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to update round.';
			return false;
		} finally {
			this.endRoundAction(roundId);
		}
	}

	async deleteRound(roundId: string): Promise<boolean> {
		if (this.isPending(roundId)) {
			return false;
		}

		this.clearMessages();
		const context = this.requireAuth();
		if (!context) {
			return false;
		}

		if (!this.requireRoundManager(roundId, context.userId, 'delete')) {
			return false;
		}

		this.beginRoundAction(roundId, 'delete');
		try {
			const payload: DeleteRoundRequestedPayloadV1 = {
				guild_id: context.scopeId,
				round_id: roundId,
				requesting_user_user_id: context.userId
			};
			this.publish(ROUND_DELETE_SUBJECT, payload);
			this.successMessage = 'Round delete requested.';
			return true;
		} catch (error) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to delete round.';
			return false;
		} finally {
			this.endRoundAction(roundId);
		}
	}
}

export const roundActionsService = new RoundActionsService();
