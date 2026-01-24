/**
 * Svelte 5 Runes-based Round State Manager
 * Direct-to-NATS event-driven architecture
 */

// ============ Types ============

type RoundState = 'scheduled' | 'started' | 'finalized' | 'cancelled';
type ParticipantResponse = 'accepted' | 'declined' | 'tentative';

interface Participant {
	userId: string;
	response: ParticipantResponse;
	score: number | null;
	tagNumber: number | null;
}

interface Round {
	id: string;
	guildId: string;
	title: string;
	location: string;
	description: string;
	startTime: string; // ISO timestamp
	state: RoundState;
	createdBy: string;
	eventMessageId: string;
	participants: Participant[];
}

// ============ RoundService Class ============

class RoundService {
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
}

export const roundService = new RoundService();
