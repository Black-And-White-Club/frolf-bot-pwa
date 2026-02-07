/**
 * Svelte 5 Runes-based Round State Manager
 * Direct-to-NATS event-driven architecture
 */

// ============ Types ============

// ============ Types ============
export type RoundState = 'scheduled' | 'started' | 'finalized' | 'cancelled';
export type ParticipantResponse = 'accepted' | 'declined' | 'tentative';

export interface Participant {
	userId: string;
	response: ParticipantResponse;
	score: number | null;
	tagNumber: number | null;
}

// Raw API format (snake_case - matches Go backend)
export interface ParticipantRaw {
	user_id: string;
	response: ParticipantResponse;
	score: number | null;
	tag_number: number | null;
	team_id?: string;
	raw_name?: string;
}

// Raw API response format (snake_case - matches Go backend)
export interface RoundRaw {
	id: string;
	guild_id: string;
	title: string;
	location: string;
	description: string;
	start_time: string | null; // ISO timestamp, can be null
	state: RoundState;
	created_by: string;
	event_message_id: string;
	discord_event_id?: string; // Native Discord Scheduled Event ID
	participants: ParticipantRaw[];
	par_values?: number[];
	holes?: number;
	current_hole?: number;
}

// Internal frontend format (camelCase)
export interface Round {
	id: string;
	guildId: string;
	title: string;
	location: string;
	description: string;
	startTime: string; // ISO timestamp
	state: RoundState;
	createdBy: string;
	eventMessageId: string;
	discordEventId?: string; // Native Discord Scheduled Event ID
	participants: Participant[];
	parValues?: number[];
	holes?: number;
	currentHole?: number;
}

// Map backend string enums (ACCEPT, DECLINE, etc) to frontend state
function mapResponse(response: string): ParticipantResponse {
	const r = (response || '').toUpperCase();
	if (r === 'ACCEPT' || r === 'ACCEPTED') return 'accepted';
	if (r === 'DECLINE' || r === 'DECLINED') return 'declined';
	return 'tentative';
}

// Transform participant from snake_case to camelCase
function transformParticipant(raw: ParticipantRaw): Participant {
	return {
		userId: raw.user_id,
		response: mapResponse(raw.response),
		score: raw.score,
		tagNumber: raw.tag_number
	};
}

// Map backend state (UPCOMING, IN_PROGRESS, etc) to frontend state
function mapRoundState(state: string): RoundState {
	const s = (state || '').toUpperCase();
	if (s === 'UPCOMING' || s === 'SCHEDULED') return 'scheduled';
	if (s === 'IN_PROGRESS' || s === 'STARTED') return 'started';
	if (s === 'FINALIZED') return 'finalized';
	return 'cancelled'; // Default fallback
}

// Transform raw API response to internal format
function transformRound(raw: RoundRaw): Round {
	return {
		id: raw.id,
		guildId: raw.guild_id,
		title: raw.title || '',
		location: raw.location || '',
		description: raw.description || '',
		startTime: raw.start_time || new Date().toISOString(), // Fallback to now if null
		state: mapRoundState(raw.state),
		createdBy: raw.created_by,
		eventMessageId: raw.event_message_id || '',
		discordEventId: raw.discord_event_id,
		participants: (raw.participants || []).map(transformParticipant),
		parValues: raw.par_values,
		holes: raw.holes,
		currentHole: raw.current_hole
	};
}

// ============ RoundService Class ============

export class RoundService {
	// State
	rounds = $state<Round[]>([]);
	selectedRoundId = $state<string | null>(null);
	isLoading = $state(false);
	lastError = $state<string | null>(null);

	// Derived
	selectedRound = $derived(this.rounds.find((r) => r.id === this.selectedRoundId) ?? null);

	activeRound = $derived(this.rounds.find((r) => r.state === 'started') ?? null);

	upcomingRounds = $derived(
		this.rounds
			.filter((r) => r.state === 'scheduled')
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
	);

	pastRounds = $derived(
		this.rounds.filter((r) => r.state === 'finalized' || r.state === 'cancelled')
	);

	// Methods
	addRound(round: Round): void {
		// Check if round with same ID exists (skip if duplicate)
		if (this.rounds.find((r) => r.id === round.id)) {
			return;
		}
		this.rounds.push(round);
	}

	updateRound(id: string, update: Partial<Round>): void {
		const idx = this.rounds.findIndex((r) => r.id === id);
		if (idx !== -1) {
			this.rounds[idx] = { ...this.rounds[idx], ...update };
		}
	}

	removeRound(id: string): void {
		this.rounds = this.rounds.filter((r) => r.id !== id);
	}

	setSelectedRound(id: string | null): void {
		this.selectedRoundId = id;
	}

	// Participant methods
	updateParticipant(roundId: string, userId: string, update: Partial<Participant>): void {
		const round = this.rounds.find((r) => r.id === roundId);
		if (!round) return;

		const participantIdx = round.participants.findIndex((p) => p.userId === userId);
		if (participantIdx !== -1) {
			round.participants[participantIdx] = {
				...round.participants[participantIdx],
				...update
			};
		}
	}

	addParticipant(roundId: string, participant: Participant): void {
		const round = this.rounds.find((r) => r.id === roundId);
		if (!round) return;

		// Avoid duplicates
		if (round.participants.find((p) => p.userId === participant.userId)) {
			return;
		}

		round.participants.push(participant);
	}

	removeParticipant(roundId: string, userId: string): void {
		const round = this.rounds.find((r) => r.id === roundId);
		if (!round) return;

		round.participants = round.participants.filter((p) => p.userId !== userId);
	}

	// Event handlers (called by NatsService)
	handleRoundCreated(payload: Round): void {
		this.addRound(payload);
	}

	handleRoundUpdated(payload: { roundId: string; update: Partial<Round> }): void {
		this.updateRound(payload.roundId, payload.update);
	}

	handleRoundDeleted(payload: { roundId: string }): void {
		this.removeRound(payload.roundId);
	}

	handleParticipantJoined(payload: { roundId: string; participant: Participant }): void {
		this.addParticipant(payload.roundId, payload.participant);
	}

	handleScoreUpdated(payload: { roundId: string; userId: string; score: number }): void {
		this.updateParticipant(payload.roundId, payload.userId, { score: payload.score });
	}

	clear(): void {
		this.rounds = [];
		this.selectedRoundId = null;
		this.lastError = null;
	}

	// Data loading methods
	setLoading(loading: boolean): void {
		this.isLoading = loading;
	}

	/**
	 * Set rounds from raw API response (snake_case format)
	 */
	setRoundsFromApi(rawRounds: RoundRaw[]): void {
		this.rounds = rawRounds.map(transformRound);
	}

	/**
	 * Set rounds directly (already in camelCase format)
	 */
	setRounds(rounds: Round[]): void {
		this.rounds = rounds;
	}
}

export const roundService = new RoundService();
