import { auth } from './auth.svelte';
import { nats } from './nats.svelte';

type CreateRoundInput = {
	title: string;
	description: string;
	startTime: string;
	timezone: string;
	location: string;
};

type CreateRoundRequestedPayloadV1 = {
	guild_id: string;
	title: string;
	description?: string;
	start_time: string;
	location: string;
	user_id: string;
	channel_id: string;
	timezone: string;
	request_source: string;
	challenge_id?: string;
};

export type CreateRoundSubmissionResult = {
	success: boolean;
	correlationId: string | null;
};

const CREATE_ROUND_SUBJECT = 'round.creation.requested.v2';
const FALLBACK_TIMEZONE = 'America/Chicago';
const ROUND_REQUEST_SOURCE = 'pwa';

class CreateRoundService {
	submitting = $state(false);
	successMessage = $state<string | null>(null);
	errorMessage = $state<string | null>(null);

	private getSubmissionContext(): { guildId: string; userId: string } | null {
		if (!auth.isAuthenticated || !auth.user) {
			this.errorMessage = 'Sign in is required to create rounds.';
			return null;
		}

		if (auth.activeRole === 'viewer') {
			this.errorMessage = 'Player role is required to create rounds.';
			return null;
		}

		const guildId = auth.user.guildId?.trim() || auth.user.activeClubUuid?.trim();
		const userId = auth.user.id?.trim();

		if (!guildId || !userId) {
			this.errorMessage = 'Club or guild identity is missing. Refresh and try again.';
			return null;
		}

		return { guildId, userId };
	}

	private buildPayload(
		input: CreateRoundInput,
		context: { guildId: string; userId: string },
		challengeId?: string | null
	): CreateRoundRequestedPayloadV1 {
		const payload: CreateRoundRequestedPayloadV1 = {
			guild_id: context.guildId,
			title: input.title.trim(),
			start_time: input.startTime.trim(),
			location: input.location.trim(),
			user_id: context.userId,
			channel_id: '',
			timezone: this.normalizeTimezone(input.timezone),
			request_source: ROUND_REQUEST_SOURCE
		};

		const description = input.description.trim();
		if (description) {
			payload.description = description;
		}

		const normalizedChallengeId = challengeId?.trim();
		if (normalizedChallengeId) {
			payload.challenge_id = normalizedChallengeId;
		}

		return payload;
	}

	private normalizeTimezone(timezone: string): string {
		const trimmedTimezone = timezone.trim();
		return trimmedTimezone || FALLBACK_TIMEZONE;
	}

	private createCorrelationId(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
		return `pwa-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
	}

	clearMessages(): void {
		this.successMessage = null;
		this.errorMessage = null;
	}

	async submitWithResult(
		input: CreateRoundInput,
		challengeId?: string | null
	): Promise<CreateRoundSubmissionResult> {
		if (this.submitting) {
			return { success: false, correlationId: null };
		}

		this.clearMessages();

		const context = this.getSubmissionContext();
		if (!context) {
			return { success: false, correlationId: null };
		}

		const payload = this.buildPayload(input, context, challengeId);
		const correlationId = this.createCorrelationId();
		const submittedAt = new Date().toISOString();

		this.submitting = true;

		try {
			nats.publish(CREATE_ROUND_SUBJECT, payload, {
				correlation_id: correlationId,
				submitted_at: submittedAt,
				user_timezone: payload.timezone,
				raw_start_time: payload.start_time,
				source: ROUND_REQUEST_SOURCE
			});
			this.successMessage = 'Round creation requested. It will appear shortly.';
			return { success: true, correlationId };
		} catch (error) {
			this.errorMessage =
				error instanceof Error ? error.message : 'Failed to submit round creation request.';
			return { success: false, correlationId: null };
		} finally {
			this.submitting = false;
		}
	}

	async submit(input: CreateRoundInput): Promise<boolean> {
		const result = await this.submitWithResult(input);
		return result.success;
	}
}

export const createRoundService = new CreateRoundService();
