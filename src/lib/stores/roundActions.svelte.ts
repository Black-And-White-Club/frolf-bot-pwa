import { auth } from './auth.svelte';
import { nats } from './nats.svelte';
import {
	roundService,
	type ParticipantResponse as RoundParticipantResponse,
	type Round
} from './round.svelte';

type ParticipantResponseInput = 'ACCEPT' | 'DECLINE' | 'TENTATIVE';

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
	response: ParticipantResponseInput;
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
const ROUND_ACTION_TIMEOUT_MS = 15_000;

type PendingRoundAction =
	| {
			kind: 'participant-response';
			label: string;
			userId: string;
			expectedResponse: ParticipantResponseInput;
	  }
	| {
			kind: 'leave-round';
			label: string;
			userId: string;
	  }
	| {
			kind: 'submit-score';
			label: string;
			userId: string;
			expectedScore: number;
	  }
	| {
			kind: 'update-round';
			label: string;
			expectedRound: Pick<Round, 'title' | 'description' | 'location'>;
	  }
	| {
			kind: 'delete-round';
			label: string;
	  };

type RoundActionReconcileReason =
	| 'participant-updated'
	| 'score-updated'
	| 'round-updated'
	| 'round-deleted'
	| 'snapshot';

class RoundActionsService {
	errorMessage = $state<string | null>(null);
	successMessage = $state<string | null>(null);
	private pendingByRound = $state<Record<string, PendingRoundAction>>({});
	private pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

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

	private beginRoundAction(roundId: string, pendingAction: PendingRoundAction): void {
		this.clearPendingTimeout(roundId);
		this.pendingByRound = {
			...this.pendingByRound,
			[roundId]: pendingAction
		};
		this.pendingTimeouts.set(
			roundId,
			setTimeout(() => this.handlePendingTimeout(roundId), ROUND_ACTION_TIMEOUT_MS)
		);
	}

	private clearPendingTimeout(roundId: string): void {
		const timeoutHandle = this.pendingTimeouts.get(roundId);
		if (!timeoutHandle) {
			return;
		}

		clearTimeout(timeoutHandle);
		this.pendingTimeouts.delete(roundId);
	}

	private endRoundAction(roundId: string): void {
		this.clearPendingTimeout(roundId);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { [roundId]: _removed, ...rest } = this.pendingByRound;
		this.pendingByRound = rest;
	}

	private handlePendingTimeout(roundId: string): void {
		const pendingAction = this.pendingByRound[roundId];
		if (!pendingAction) {
			return;
		}

		this.endRoundAction(roundId);
		this.errorMessage = `Still waiting for the ${pendingAction.label} request to finish. Refresh if the round does not update soon.`;
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

	private toRoundParticipantResponse(response: ParticipantResponseInput): RoundParticipantResponse {
		switch (response) {
			case 'ACCEPT':
				return 'accepted';
			case 'DECLINE':
				return 'declined';
			case 'TENTATIVE':
				return 'tentative';
		}
	}

	private matchesPendingRoundState(
		roundId: string,
		pendingAction: PendingRoundAction,
		reason: RoundActionReconcileReason
	): boolean {
		const round = roundService.rounds.find((entry) => entry.id === roundId);

		switch (pendingAction.kind) {
			case 'participant-response': {
				if (!round) {
					return false;
				}

				const participant = round.participants.find(
					(entry) => entry.userId === pendingAction.userId
				);
				return (
					participant?.response === this.toRoundParticipantResponse(pendingAction.expectedResponse)
				);
			}
			case 'leave-round': {
				if (!round) {
					return false;
				}

				return !round.participants.some((entry) => entry.userId === pendingAction.userId);
			}
			case 'submit-score': {
				if (!round) {
					return false;
				}

				const participant = round.participants.find(
					(entry) => entry.userId === pendingAction.userId
				);
				return participant?.score === pendingAction.expectedScore;
			}
			case 'update-round': {
				if (reason === 'round-updated') {
					return true;
				}

				if (!round) {
					return false;
				}

				return (
					round.title === pendingAction.expectedRound.title &&
					round.description === pendingAction.expectedRound.description &&
					round.location === pendingAction.expectedRound.location
				);
			}
			case 'delete-round':
				return reason === 'round-deleted' || !round;
		}
	}

	reconcileRound(roundId: string, reason: RoundActionReconcileReason = 'snapshot'): void {
		const pendingAction = this.pendingByRound[roundId];
		if (!pendingAction) {
			return;
		}

		if (this.matchesPendingRoundState(roundId, pendingAction, reason)) {
			this.endRoundAction(roundId);
		}
	}

	reconcileAllFromSnapshot(): void {
		for (const roundId of Object.keys(this.pendingByRound)) {
			this.reconcileRound(roundId, 'snapshot');
		}
	}

	private requireRoundManager(roundId: string, userId: string, action: 'edit' | 'delete'): boolean {
		if (this.canManageRound(roundId, userId)) {
			return true;
		}

		this.errorMessage = `Round creator, editor, or admin role is required to ${action} rounds.`;
		return false;
	}

	async setParticipantResponse(
		roundId: string,
		response: ParticipantResponseInput
	): Promise<boolean> {
		if (this.isPending(roundId)) {
			return false;
		}

		this.clearMessages();
		const context = this.requireAuth();
		if (!context) {
			return false;
		}

		this.beginRoundAction(roundId, {
			kind: 'participant-response',
			label: 'RSVP',
			userId: context.userId,
			expectedResponse: response
		});
		try {
			const payload: ParticipantJoinRequestedPayloadV1 = {
				guild_id: context.scopeId,
				round_id: roundId,
				user_id: context.userId,
				response
			};
			this.publish(PARTICIPANT_JOIN_SUBJECT, payload);
			this.successMessage = 'RSVP update requested. It will refresh shortly.';
			return true;
		} catch (error) {
			this.endRoundAction(roundId);
			this.errorMessage = error instanceof Error ? error.message : 'Failed to update RSVP.';
			return false;
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

		this.beginRoundAction(roundId, {
			kind: 'leave-round',
			label: 'leave',
			userId: context.userId
		});
		try {
			const payload: ParticipantRemovalRequestedPayloadV1 = {
				guild_id: context.scopeId,
				round_id: roundId,
				user_id: context.userId
			};
			this.publish(PARTICIPANT_REMOVAL_SUBJECT, payload);
			this.successMessage = 'Leave request sent. The round will refresh shortly.';
			return true;
		} catch (error) {
			this.endRoundAction(roundId);
			this.errorMessage = error instanceof Error ? error.message : 'Failed to leave round.';
			return false;
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

		this.beginRoundAction(roundId, {
			kind: 'submit-score',
			label: 'score',
			userId: context.userId,
			expectedScore: score
		});
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
			this.successMessage = 'Score submitted. It will refresh shortly.';
			return true;
		} catch (error) {
			this.endRoundAction(roundId);
			this.errorMessage = error instanceof Error ? error.message : 'Failed to submit score.';
			return false;
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

		this.beginRoundAction(roundId, {
			kind: 'update-round',
			label: 'round update',
			expectedRound: {
				title: input.title.trim(),
				description: input.description.trim(),
				location: input.location.trim()
			}
		});
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
			this.successMessage = 'Round update requested. It will refresh shortly.';
			return true;
		} catch (error) {
			this.endRoundAction(roundId);
			this.errorMessage = error instanceof Error ? error.message : 'Failed to update round.';
			return false;
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

		this.beginRoundAction(roundId, {
			kind: 'delete-round',
			label: 'delete'
		});
		try {
			const payload: DeleteRoundRequestedPayloadV1 = {
				guild_id: context.scopeId,
				round_id: roundId,
				requesting_user_user_id: context.userId
			};
			this.publish(ROUND_DELETE_SUBJECT, payload);
			this.successMessage = 'Round delete requested. It will refresh shortly.';
			return true;
		} catch (error) {
			this.endRoundAction(roundId);
			this.errorMessage = error instanceof Error ? error.message : 'Failed to delete round.';
			return false;
		}
	}
}

export const roundActionsService = new RoundActionsService();
