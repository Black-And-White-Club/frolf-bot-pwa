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
import { roundActionsService } from './roundActions.svelte';
import { tagStore } from './tags.svelte';
import { dataLoader } from './dataLoader.svelte';

type WireRoundID = string | number[];

interface BaseRoundPayloadV1 {
	round_id: WireRoundID;
	title: string;
	description?: string;
	location?: string;
	start_time?: string | null | Record<string, unknown>;
	user_id?: string;
}

interface RoundCreatedPayloadV1 {
	guild_id: string;
	channel_id: string;
	BaseRoundPayload: BaseRoundPayloadV1;
}

type RoundUpdatedPayload = {
	round_id?: WireRoundID;
	roundId?: string;
	update?: Partial<Round>;
};

interface RoundDeletedPayloadV1 {
	round_id: WireRoundID;
	guild_id: string;
	discord_message_id: string;
	channel_id?: string;
}

interface RoundStartedPayloadV1 {
	round_id: WireRoundID;
	guild_id: string;
	channel_id: string;
	title: string;
	location: string;
	start_time?: string | null | Record<string, unknown>;
}

interface RoundFinalizedPayloadV1 {
	round_id: WireRoundID;
	guild_id: string;
	round_data?: {
		id: WireRoundID;
		title: string;
		description: string;
		location: string;
		start_time?: string | null | Record<string, unknown>;
		state: string;
		created_by: string;
		event_message_id: string;
		guild_id: string;
		participants?: RoundParticipantPayload[];
	};
}

interface RoundParticipantPayload {
	user_id: string;
	response: string;
	score?: number | null;
	tag_number?: number | null;
	raw_name?: string;
	hole_scores?: number[];
	is_dnf?: boolean;
}

interface ParticipantJoinedPayloadV1 {
	round_id: WireRoundID;
	guild_id: string;
	discord_message_id: string;
	accepted_participants?: RoundParticipantPayload[];
	declined_participants?: RoundParticipantPayload[];
	tentative_participants?: RoundParticipantPayload[];
}

type ParticipantSnapshotPayload = {
	accepted_participants?: RoundParticipantPayload[];
	declined_participants?: RoundParticipantPayload[];
	tentative_participants?: RoundParticipantPayload[];
};

type ParticipantRemovedPayloadV1 = ParticipantSnapshotPayload & {
	round_id: WireRoundID;
	guild_id: string;
	discord_message_id: string;
	user_id: string;
};

interface ParticipantScoreUpdatedPayloadV1 {
	round_id: WireRoundID;
	guild_id: string;
	channel_id: string;
	discord_message_id: string;
	user_id?: string;
	score?: number;
	participants?: RoundParticipantPayload[] | ParticipantRaw[];
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

type ChallengeFactPayloadV1 = {
	challenge: unknown;
};

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
		this.subscribeChallengeEvents(id);
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
			nats.subscribe(`round.created.v2.${guildId}`, (msg) => {
				const roundRaw = toRoundRaw(msg.data as RoundCreatedPayloadV1 | RoundRaw);
				roundService.handleRoundCreated(roundRaw);
			})
		);

		// Round updated
		this.unsubscribers.push(
			nats.subscribe(`round.updated.v2.${guildId}`, (msg) => {
				const payload = msg.data as RoundUpdatedPayload;
				const roundId = payload.roundId || roundIdFromWire(payload.round_id);
				if (!roundId) return;
				if (!payload.update) {
					roundActionsService.reconcileRound(roundId, 'round-updated');
					void dataLoader.reload();
					return;
				}
				roundService.handleRoundUpdated({ roundId, update: payload.update });
				roundActionsService.reconcileRound(roundId, 'round-updated');
			})
		);

		// Round deleted
		this.unsubscribers.push(
			nats.subscribe(`round.deleted.v2.${guildId}`, (msg) => {
				const payload = msg.data as RoundDeletedPayloadV1;
				const roundId = roundIdFromWire(payload.round_id);
				if (!roundId) return;
				roundService.handleRoundDeleted({ roundId });
				roundActionsService.reconcileRound(roundId, 'round-deleted');
			})
		);

		// Round started
		this.unsubscribers.push(
			nats.subscribe(`round.started.v2.${guildId}`, (msg) => {
				const payload = msg.data as RoundStartedPayloadV1;
				const roundId = roundIdFromWire(payload.round_id);
				if (!roundId) return;

				const update: Partial<Round> = { state: 'started' };
				if (payload.title) update.title = payload.title;
				if (payload.location) update.location = payload.location;
				const startTime = normalizeStartTime(payload.start_time);
				if (startTime) update.startTime = startTime;

				roundService.handleRoundUpdated({
					roundId,
					update
				});
				roundActionsService.reconcileRound(roundId, 'round-updated');
			})
		);

		// Round finalized
		this.unsubscribers.push(
			nats.subscribe(`round.finalized.v2.${guildId}`, (msg) => {
				const payload = msg.data as RoundFinalizedPayloadV1;
				const roundId = roundIdFromWire(payload.round_id);
				if (!roundId) return;

				const finalizedRoundRaw = toRoundRawFromFinalizedPayload(payload);
				if (finalizedRoundRaw) {
					roundService.handleRoundCreated(finalizedRoundRaw);
				}

				roundService.handleRoundUpdated({
					roundId,
					update: buildFinalizedRoundUpdate(payload)
				});
				roundActionsService.reconcileRound(roundId, 'round-updated');
			})
		);

		// Participant joined
		this.unsubscribers.push(
			nats.subscribe(`round.participant.joined.v2.${guildId}`, (msg) => {
				const payload = msg.data as ParticipantJoinedPayloadV1;
				const roundId = roundIdFromWire(payload.round_id);
				if (!roundId) return;

				const participants = flattenParticipants(payload);
				if (participants.length === 0) return;

				roundService.handleRoundUpdated({
					roundId,
					update: { participants }
				});
				roundActionsService.reconcileRound(roundId, 'participant-updated');
			})
		);

		// Participant removed
		this.unsubscribers.push(
			nats.subscribe(`round.participant.removed.v2.${guildId}`, (msg) => {
				const payload = msg.data as ParticipantRemovedPayloadV1;
				const roundId = roundIdFromWire(payload.round_id);
				if (!roundId) return;

				if (hasParticipantSnapshot(payload)) {
					const participants = flattenParticipants(payload);
					roundService.handleRoundUpdated({
						roundId,
						update: { participants }
					});
					roundActionsService.reconcileRound(roundId, 'participant-updated');
					return;
				}

				if (!payload.user_id) {
					return;
				}

				roundService.removeParticipant(roundId, payload.user_id);
				roundActionsService.reconcileRound(roundId, 'participant-updated');
			})
		);

		// Score updated
		this.unsubscribers.push(
			nats.subscribe(`round.participant.score.updated.v2.${guildId}`, (msg) => {
				const payload = msg.data as ParticipantScoreUpdatedPayloadV1;
				const roundId = roundIdFromWire(payload.round_id);
				if (!roundId) return;

				if (Array.isArray(payload.participants) && payload.participants.length > 0) {
					roundService.handleScoresSnapshot({
						roundId,
						participants: payload.participants.map(toParticipantRaw)
					});
					roundActionsService.reconcileRound(roundId, 'score-updated');
					return;
				}

				if (!payload.user_id || typeof payload.score !== 'number') {
					return;
				}
				roundService.handleScoreUpdated({
					roundId,
					userId: payload.user_id,
					score: payload.score
				});
				roundActionsService.reconcileRound(roundId, 'score-updated');
			})
		);
	}

	/**
	 * Subscribe to leaderboard events
	 */
	private subscribeLeaderboardEvents(guildId: string): void {
		// Full leaderboard update
		this.unsubscribers.push(
			nats.subscribe(`leaderboard.updated.v2.${guildId}`, () => {
				dataLoader.reload();
			})
		);

		// Tag updated (single entry change)
		this.unsubscribers.push(
			nats.subscribe(`leaderboard.tag.updated.v2.${guildId}`, (msg) => {
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
			nats.subscribe(`leaderboard.tag.swap.processed.v2.${guildId}`, (msg) => {
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

	private subscribeChallengeEvents(scopeId: string): void {
		const subjects = [
			'club.challenge.opened.v1',
			'club.challenge.accepted.v1',
			'club.challenge.declined.v1',
			'club.challenge.withdrawn.v1',
			'club.challenge.expired.v1',
			'club.challenge.hidden.v1',
			'club.challenge.completed.v1',
			'club.challenge.round.linked.v1',
			'club.challenge.round.unlinked.v1',
			'club.challenge.refreshed.v1'
		];

		for (const subject of subjects) {
			this.unsubscribers.push(
				nats.subscribe(`${subject}.${scopeId}`, (msg) => {
					challengeStore.handleFact(msg.data as ChallengeFactPayloadV1);
				})
			);
		}
	}
}

function toRoundRaw(payload: RoundCreatedPayloadV1 | RoundRaw): RoundRaw {
	if ('id' in payload) {
		return payload;
	}

	const basePayload = payload.BaseRoundPayload;
	const roundID = roundIdFromWire(basePayload.round_id);

	return {
		id: roundID,
		guild_id: payload.guild_id,
		title: basePayload.title || '',
		location: basePayload.location || '',
		description: basePayload.description || '',
		start_time: normalizeStartTime(basePayload.start_time),
		state: 'scheduled',
		created_by: basePayload.user_id || '',
		event_message_id: payload.channel_id || '',
		participants: []
	};
}

function toOptionalNumber(value: number | null | undefined): number | undefined {
	return typeof value === 'number' ? value : undefined;
}

function hasParticipantSnapshot(payload: ParticipantSnapshotPayload): boolean {
	return (
		Array.isArray(payload.accepted_participants) ||
		Array.isArray(payload.declined_participants) ||
		Array.isArray(payload.tentative_participants)
	);
}

function flattenParticipants(payload: ParticipantSnapshotPayload) {
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

function toParticipantRaw(participant: RoundParticipantPayload | ParticipantRaw): ParticipantRaw {
	return {
		user_id: participant.user_id,
		response: normalizeResponse(participant.response, 'tentative'),
		score: typeof participant.score === 'number' ? participant.score : null,
		tag_number: typeof participant.tag_number === 'number' ? participant.tag_number : null,
		raw_name: participant.raw_name,
		hole_scores: Array.isArray(participant.hole_scores) ? participant.hole_scores : undefined,
		is_dnf: participant.is_dnf === true ? true : undefined
	};
}

function toParticipant(
	participant: RoundParticipantPayload,
	fallbackResponse: ParticipantRaw['response']
) {
	return participantFromRaw(
		toParticipantRaw({ ...participant, response: participant.response || fallbackResponse })
	);
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

function normalizeStartTime(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

function roundIdFromWire(value: WireRoundID | undefined): string {
	if (typeof value === 'string') {
		return value;
	}

	if (Array.isArray(value)) {
		const bytes = value.filter((entry): entry is number => Number.isInteger(entry) && entry >= 0);
		if (bytes.length === 16 && bytes.every((entry) => entry <= 255)) {
			const hex = bytes.map((entry) => entry.toString(16).padStart(2, '0')).join('');
			return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
		}
		return bytes.map(String).join('-');
	}

	return '';
}

function buildFinalizedRoundUpdate(payload: RoundFinalizedPayloadV1): Partial<Round> {
	const update: Partial<Round> = { state: 'finalized' };
	const data = payload.round_data;
	if (!data) return update;

	if (data.participants) {
		update.participants = data.participants.map((p) => toParticipant(p, 'tentative'));
	}
	if (data.title) update.title = data.title;
	if (data.location) update.location = data.location;
	if (data.description !== undefined) update.description = data.description;
	const startTime = normalizeStartTime(data.start_time);
	if (startTime) update.startTime = startTime;
	if (data.event_message_id) update.eventMessageId = data.event_message_id;
	return update;
}

function toRoundRawFromFinalizedPayload(payload: RoundFinalizedPayloadV1): RoundRaw | null {
	const data = payload.round_data;
	if (!data) return null;

	const roundID = roundIdFromWire(data.id) || roundIdFromWire(payload.round_id);
	if (!roundID) return null;

	const {
		guild_id,
		title,
		location,
		description,
		start_time,
		created_by,
		event_message_id,
		participants = []
	} = data;
	return {
		id: roundID,
		guild_id: guild_id || payload.guild_id,
		title,
		location,
		description,
		start_time: normalizeStartTime(start_time),
		state: 'finalized',
		created_by,
		event_message_id,
		participants: participants.map(toParticipantRaw)
	};
}

export const subscriptionManager = new SubscriptionManager();
