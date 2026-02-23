/**
 * Subscription Manager
 * Routes NATS subjects to state services
 */

import { nats } from './nats.svelte';
import {
	participantFromRaw,
	roundService,
	type ParticipantRaw,
	type Round,
	type RoundRaw
} from './round.svelte';
import { leaderboardService } from './leaderboard.svelte';
import { tagStore } from './tags.svelte';
import { dataLoader } from './dataLoader.svelte';

interface RoundCreatedPayloadV1 {
	guild_id: string;
	round_id: string;
	title: string;
	description?: string;
	location?: string;
	start_time?: string | null;
	user_id?: string;
	discord_message_id?: string;
}

interface RoundUpdatedPayload {
	round_id?: string;
	roundId?: string;
	update?: Partial<Round>;
}

interface RoundDeletedPayloadV1 {
	round_id: string;
}

interface RoundStartedPayloadV1 {
	round_id: string;
}

interface RoundFinalizedPayloadV1 {
	round_id: string;
}

interface RoundParticipantPayload {
	user_id: string;
	response: string;
	score?: number | null;
	tag_number?: number | null;
}

interface ParticipantJoinedPayloadV1 {
	round_id: string;
	accepted_participants?: RoundParticipantPayload[];
	declined_participants?: RoundParticipantPayload[];
	tentative_participants?: RoundParticipantPayload[];
}

interface ParticipantScoreUpdatedPayloadV1 {
	round_id: string;
	user_id?: string;
	score?: number;
	participants?: ParticipantRaw[];
}

interface LeaderboardTagUpdatedPayloadV1 {
	user_id: string;
	old_tag?: number | null;
	new_tag?: number | null;
}

interface TagSwapProcessedPayloadV1 {
	requestor_id: string;
	target_id: string;
}

class SubscriptionManager {
	private unsubscribers: (() => void)[] = [];
	private id: string | null = null;
	/**
	 * Start all subscriptions for a club/guild
	 */
	start(id: string): void {
		this.stop();

		this.id = id;
		this.subscribeRoundEvents(id);
		this.subscribeLeaderboardEvents(id);
	}

	/**
	 * Stop all subscriptions
	 */
	stop(): void {
		this.unsubscribers.forEach((unsub) => unsub());
		this.unsubscribers = [];
		this.id = null;
	}

	/**
	 * Subscribe to round events
	 */
	private subscribeRoundEvents(guildId: string): void {
		// Round created
		this.unsubscribers.push(
			nats.subscribe(`round.created.v1.${guildId}`, (msg) => {
				roundService.handleRoundCreated(toRoundRaw(msg.data as RoundCreatedPayloadV1 | RoundRaw));
			})
		);

		// Round updated
		this.unsubscribers.push(
			nats.subscribe(`round.updated.v1.${guildId}`, (msg) => {
				const payload = msg.data as RoundUpdatedPayload;
				const roundId = payload.roundId || payload.round_id;
				if (!roundId || !payload.update) return;
				roundService.handleRoundUpdated({ roundId, update: payload.update });
			})
		);

		// Round deleted
		this.unsubscribers.push(
			nats.subscribe(`round.deleted.v1.${guildId}`, (msg) => {
				const payload = msg.data as RoundDeletedPayloadV1;
				roundService.handleRoundDeleted({ roundId: payload.round_id });
			})
		);

		// Round started
		this.unsubscribers.push(
			nats.subscribe(`round.started.v1.${guildId}`, (msg) => {
				const payload = msg.data as RoundStartedPayloadV1;
				roundService.handleRoundUpdated({
					roundId: payload.round_id,
					update: { state: 'started' }
				});
			})
		);

		// Round finalized
		this.unsubscribers.push(
			nats.subscribe(`round.finalized.v1.${guildId}`, (msg) => {
				const payload = msg.data as RoundFinalizedPayloadV1;
				roundService.handleRoundUpdated({
					roundId: payload.round_id,
					update: { state: 'finalized' }
				});
			})
		);

		// Participant joined
		this.unsubscribers.push(
			nats.subscribe(`round.participant.joined.v1.${guildId}`, (msg) => {
				const payload = msg.data as ParticipantJoinedPayloadV1;
				const participants = flattenParticipants(payload);
				if (participants.length === 0) return;

				roundService.handleRoundUpdated({
					roundId: payload.round_id,
					update: { participants }
				});
			})
		);

		// Score updated
		this.unsubscribers.push(
			nats.subscribe(`round.participant.score.updated.v1.${guildId}`, (msg) => {
				const payload = msg.data as ParticipantScoreUpdatedPayloadV1;
				if (!payload.round_id) return;

				if (Array.isArray(payload.participants) && payload.participants.length > 0) {
					roundService.handleScoresSnapshot({
						roundId: payload.round_id,
						participants: payload.participants
					});
					return;
				}

				if (!payload.user_id || typeof payload.score !== 'number') {
					return;
				}
				roundService.handleScoreUpdated({
					roundId: payload.round_id,
					userId: payload.user_id,
					score: payload.score
				});
			})
		);
	}

	/**
	 * Subscribe to leaderboard events
	 */
	private subscribeLeaderboardEvents(guildId: string): void {
		// Full leaderboard update
		this.unsubscribers.push(
			nats.subscribe(`leaderboard.updated.v1.${guildId}`, () => {
				dataLoader.reload();
			})
		);

		// Tag updated (single entry change)
		this.unsubscribers.push(
			nats.subscribe(`leaderboard.tag.updated.v1.${guildId}`, (msg) => {
				const payload = msg.data as LeaderboardTagUpdatedPayloadV1;
				leaderboardService.applyPatch({
					op: 'upsert_entry',
					entry: {
						userId: payload.user_id,
						tagNumber: toOptionalNumber(payload.new_tag),
						previousTagNumber: toOptionalNumber(payload.old_tag)
					}
				});
				tagStore.upsertTagMember({
					memberId: payload.user_id,
					currentTag: payload.new_tag ?? null
				});
			})
		);

		// Tag swap processed
		this.unsubscribers.push(
			nats.subscribe(`leaderboard.tag.swap.processed.v1.${guildId}`, (msg) => {
				const payload = msg.data as TagSwapProcessedPayloadV1;
				leaderboardService.applyPatch({
					op: 'swap_tags',
					userIdA: payload.requestor_id,
					userIdB: payload.target_id
				});
				tagStore.swapTagMembers(payload.requestor_id, payload.target_id);
			})
		);
	}
}

function toRoundRaw(payload: RoundCreatedPayloadV1 | RoundRaw): RoundRaw {
	if ('id' in payload) {
		return payload;
	}

	return {
		id: payload.round_id,
		guild_id: payload.guild_id,
		title: payload.title,
		location: payload.location || '',
		description: payload.description || '',
		start_time: payload.start_time || null,
		state: 'scheduled',
		created_by: payload.user_id || '',
		event_message_id: payload.discord_message_id || '',
		participants: []
	};
}

function toOptionalNumber(value: number | null | undefined): number | undefined {
	return typeof value === 'number' ? value : undefined;
}

function flattenParticipants(payload: ParticipantJoinedPayloadV1) {
	const accepted = (payload.accepted_participants || []).map((participant) =>
		toParticipant(participant, 'accepted')
	);
	const declined = (payload.declined_participants || []).map((participant) =>
		toParticipant(participant, 'declined')
	);
	const tentative = (payload.tentative_participants || []).map((participant) =>
		toParticipant(participant, 'tentative')
	);

	return [...accepted, ...declined, ...tentative];
}

function toParticipant(
	participant: RoundParticipantPayload,
	fallbackResponse: ParticipantRaw['response']
) {
	return participantFromRaw({
		user_id: participant.user_id,
		response: normalizeResponse(participant.response, fallbackResponse),
		score: participant.score ?? null,
		tag_number: participant.tag_number ?? null
	});
}

function normalizeResponse(
	response: string | undefined,
	fallback: ParticipantRaw['response']
): ParticipantRaw['response'] {
	const normalized = (response || '').trim().toLowerCase();
	if (normalized === 'accept' || normalized === 'accepted') return 'accepted';
	if (normalized === 'decline' || normalized === 'declined') return 'declined';
	if (normalized === 'tentative') return 'tentative';
	return fallback;
}

export const subscriptionManager = new SubscriptionManager();
