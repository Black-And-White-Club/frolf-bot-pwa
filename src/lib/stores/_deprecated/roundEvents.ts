/**
 * Event-Driven Architecture for Round Management
 * Efficiently handles round updates with debouncing and filtering
 */

import { writable, derived } from 'svelte/store';
import type { Round } from '$lib/types/backend';

// Round event types
export type RoundEventType =
	| 'round_created'
	| 'round_updated'
	| 'round_status_changed'
	| 'participant_joined'
	| 'participant_left'
	| 'score_updated'
	| 'round_completed';

export interface RoundEvent {
	id: string;
	type: RoundEventType;
	roundId: string;
	timestamp: number;
	payload: Record<string, unknown>;
	guildId: string;
}

// Main round store
export const rounds = writable<Round[]>([]);
export const roundEvents = writable<RoundEvent[]>([]);

// Derived stores for different round types
export const activeRounds = derived(rounds, ($rounds) =>
	$rounds.filter((round) => round.status === 'active')
);

export const scheduledRounds = derived(rounds, ($rounds) =>
	$rounds.filter((round) => round.status === 'scheduled')
);

export const completedRounds = derived(rounds, ($rounds) =>
	$rounds.filter((round) => round.status === 'completed')
);

// Event processing with debouncing
// Internal event type includes a sequence to break ties when timestamps are equal
type InternalRoundEvent = RoundEvent & { __seq: number };

let eventQueue: InternalRoundEvent[] = [];
let processingTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
const DEBOUNCE_MS = 100; // Process events every 100ms
let __seqCounter = 0;

function processEventQueue() {
	if (eventQueue.length === 0) return;

	// Group events by roundId and type
	const groupedEvents = eventQueue.reduce(
		(acc, event) => {
			const key = `${event.roundId}-${event.type}`;
			if (!acc[key]) acc[key] = [];
			acc[key].push(event);
			return acc;
		},
		{} as Record<string, InternalRoundEvent[]>
	);

	// Process only the latest event for each group (debouncing)
	// When timestamps are equal (e.g., fake timers in tests), use the internal
	// sequence number to decide which event came later.
	const latestEvents = Object.values(groupedEvents).map(
		(events) => events.slice().sort((a, b) => b.timestamp - a.timestamp || b.__seq - a.__seq)[0]
	);

	// Update rounds store
	rounds.update((currentRounds) => {
		let updatedRounds = [...currentRounds];

		for (const event of latestEvents) {
			switch (event.type) {
				case 'round_created':
					// Add new round if it doesn't exist
					if (!updatedRounds.find((r) => r.round_id === event.roundId)) {
						updatedRounds.push(event.payload.round as Round);
					}
					break;

				case 'round_updated':
				case 'round_status_changed':
					// Update existing round
					updatedRounds = updatedRounds.map((round) =>
						round.round_id === event.roundId
							? { ...round, ...(event.payload.updates as Partial<Round>) }
							: round
					);
					break;

				case 'participant_joined':
					// Add participant to round
					updatedRounds = updatedRounds.map((round) =>
						round.round_id === event.roundId
							? {
									...round,
									participants: [
										...round.participants,
										event.payload.participant as Round['participants'][0]
									]
								}
							: round
					);
					break;

				case 'participant_left':
					// Remove participant from round
					updatedRounds = updatedRounds.map((round) =>
						round.round_id === event.roundId
							? {
									...round,
									participants: round.participants.filter(
										(p) => p.user_id !== (event.payload.userId as string)
									)
								}
							: round
					);
					break;

				case 'score_updated':
					// Update participant score
					updatedRounds = updatedRounds.map((round) =>
						round.round_id === event.roundId
							? {
									...round,
									participants: round.participants.map((p) =>
										p.user_id === (event.payload.userId as string)
											? { ...p, score: event.payload.score as number }
											: p
									)
								}
							: round
					);
					break;

				case 'round_completed':
					// Mark round as completed
					updatedRounds = updatedRounds.map((round) =>
						round.round_id === event.roundId
							? { ...round, status: 'completed', completed_at: event.timestamp }
							: round
					);
					break;
			}
		}

		return updatedRounds;
	});

	// Add processed events to history (strip internal seq)
	roundEvents.update((events) => [
		...events,
		...latestEvents.map(
			(ev) =>
				({
					id: ev.id,
					type: ev.type,
					roundId: ev.roundId,
					timestamp: ev.timestamp,
					payload: ev.payload,
					guildId: ev.guildId
				}) as RoundEvent
		)
	]);

	// Clear queue
	eventQueue = [];
	processingTimeout = null;
}

// Public API functions
export function emitRoundEvent(event: Omit<RoundEvent, 'id' | 'timestamp'>) {
	const baseEvent: RoundEvent = {
		...event,
		id: crypto.randomUUID(),
		timestamp: Date.now()
	};

	const fullEvent: InternalRoundEvent = { ...baseEvent, __seq: ++__seqCounter };

	eventQueue.push(fullEvent);

	// Debounce processing (use globalThis for environment safety)
	if (processingTimeout) globalThis.clearTimeout(processingTimeout);
	processingTimeout = globalThis.setTimeout(processEventQueue, DEBOUNCE_MS);
}

export function initializeRounds(initialRounds: Round[]) {
	rounds.set(initialRounds);
}

// Filter events by criteria to prevent spam
export function getFilteredEvents(filters: {
	roundId?: string;
	type?: RoundEventType;
	guildId?: string;
	since?: number;
	limit?: number;
}) {
	return derived(roundEvents, ($events) => {
		let filtered = $events;

		if (filters.roundId) {
			filtered = filtered.filter((e) => e.roundId === filters.roundId);
		}
		if (filters.type) {
			filtered = filtered.filter((e) => e.type === filters.type);
		}
		if (filters.guildId) {
			filtered = filtered.filter((e) => e.guildId === filters.guildId);
		}
		if (filters.since) {
			filtered = filtered.filter((e) => e.timestamp >= filters.since!);
		}

		// Sort by timestamp descending (newest first)
		filtered.sort((a, b) => b.timestamp - a.timestamp);

		if (filters.limit) {
			filtered = filtered.slice(0, filters.limit);
		}

		return filtered;
	});
}

// Cleanup function
export function cleanupRoundEvents() {
	if (processingTimeout) {
		globalThis.clearTimeout(processingTimeout);
		processingTimeout = null;
	}
	eventQueue = [];
}
