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
};

const CREATE_ROUND_SUBJECT = 'round.creation.requested.v1';
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

		const guildId = auth.user.guildId?.trim();
		const userId = auth.user.id?.trim();

		if (!guildId || !userId) {
			this.errorMessage = 'Guild identity is missing. Refresh and try again.';
			return null;
		}

		return { guildId, userId };
	}

	private buildPayload(
		input: CreateRoundInput,
		context: { guildId: string; userId: string }
	): CreateRoundRequestedPayloadV1 {
		const payload: CreateRoundRequestedPayloadV1 = {
			guild_id: context.guildId,
			title: input.title.trim(),
			start_time: input.startTime.trim(),
			location: input.location.trim(),
			user_id: context.userId,
			channel_id: '',
			timezone: this.normalizeTimezone(input.timezone)
		};

		const description = input.description.trim();
		if (description) {
			payload.description = description;
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

	async submit(input: CreateRoundInput): Promise<boolean> {
		if (this.submitting) {
			return false;
		}

		this.clearMessages();

		const context = this.getSubmissionContext();
		if (!context) {
			return false;
		}

		const payload = this.buildPayload(input, context);
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
			return true;
		} catch (error) {
			this.errorMessage =
				error instanceof Error ? error.message : 'Failed to submit round creation request.';
			return false;
		} finally {
			this.submitting = false;
		}
	}
}

export const createRoundService = new CreateRoundService();
