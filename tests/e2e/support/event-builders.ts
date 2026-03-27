export interface RoundParticipantRaw {
	user_id: string;
	response: 'accepted' | 'declined' | 'tentative';
	score: number | null;
	tag_number: number | null;
}

export interface RoundCreatedEventPayload {
	id: string;
	guild_id: string;
	title: string;
	location: string;
	description: string;
	start_time: string;
	state: 'scheduled' | 'started' | 'finalized' | 'cancelled';
	created_by: string;
	event_message_id: string;
	participants: RoundParticipantRaw[];
}

export interface RoundStartedEventPayload {
	round_id: string;
}

export interface RoundParticipantJoinedEventPayload {
	round_id: string;
	accepted_participants: RoundParticipantRaw[];
	declined_participants?: RoundParticipantRaw[];
	tentative_participants?: RoundParticipantRaw[];
}

export interface RoundParticipantScoreUpdatedEventPayload {
	round_id: string;
	user_id: string;
	score: number;
}

export interface RoundDeletedEventPayload {
	round_id: string;
}

export interface LeaderboardUpdatedEventPayload {
	guild_id: string;
	leaderboard_id: number;
	round_id: string;
	leaderboard_data: Record<string, string>;
}

export interface LeaderboardTagUpdatedEventPayload {
	user_id: string;
	old_tag?: number;
	new_tag?: number;
}

export interface LeaderboardTagSwapProcessedEventPayload {
	requestor_id: string;
	target_id: string;
}

export interface LeaderboardSnapshotResponsePayload {
	guild_id: string;
	leaderboard: Array<{
		tag_number: number;
		user_id: string;
		total_points: number;
		rounds_played: number;
	}>;
}

export interface RoundListResponsePayload {
	rounds: RoundCreatedEventPayload[];
	profiles?: Record<string, unknown>;
}

export interface TagListResponsePayload {
	guild_id: string;
	members: Array<{
		member_id: string;
		current_tag: number | null;
		last_active_at?: string;
	}>;
}

export function buildRoundCreated(
	overrides: Partial<RoundCreatedEventPayload> = {}
): RoundCreatedEventPayload {
	return {
		id: 'round-1',
		guild_id: 'guild-123',
		title: 'Weekly Tag Round',
		location: 'Pier Park',
		description: '',
		start_time: '2026-01-25T10:00:00Z',
		state: 'scheduled',
		created_by: 'user-1',
		event_message_id: 'msg-1',
		participants: [],
		...overrides
	};
}

export function buildRoundStarted(
	overrides: Partial<RoundStartedEventPayload> = {}
): RoundStartedEventPayload {
	return {
		round_id: 'round-1',
		...overrides
	};
}

export function buildRoundParticipantJoined(
	overrides: Partial<RoundParticipantJoinedEventPayload> = {}
): RoundParticipantJoinedEventPayload {
	return {
		round_id: 'round-1',
		accepted_participants: [
			{
				user_id: 'user-2',
				response: 'accepted',
				score: null,
				tag_number: 5
			}
		],
		...overrides
	};
}

export function buildRoundParticipantScoreUpdated(
	overrides: Partial<RoundParticipantScoreUpdatedEventPayload> = {}
): RoundParticipantScoreUpdatedEventPayload {
	return {
		round_id: 'round-1',
		user_id: 'user-2',
		score: -3,
		...overrides
	};
}

export function buildRoundDeleted(
	overrides: Partial<RoundDeletedEventPayload> = {}
): RoundDeletedEventPayload {
	return {
		round_id: 'round-1',
		...overrides
	};
}

export function buildLeaderboardUpdated(
	overrides: Partial<LeaderboardUpdatedEventPayload> = {}
): LeaderboardUpdatedEventPayload {
	return {
		guild_id: 'guild-123',
		leaderboard_id: 1,
		round_id: 'round-1',
		leaderboard_data: { '1': 'user-1' },
		...overrides
	};
}

export function buildLeaderboardTagUpdated(
	overrides: Partial<LeaderboardTagUpdatedEventPayload> = {}
): LeaderboardTagUpdatedEventPayload {
	return {
		user_id: 'user-2',
		old_tag: 2,
		new_tag: 1,
		...overrides
	};
}

export function buildLeaderboardTagSwapProcessed(
	overrides: Partial<LeaderboardTagSwapProcessedEventPayload> = {}
): LeaderboardTagSwapProcessedEventPayload {
	return {
		requestor_id: 'user-1',
		target_id: 'user-2',
		...overrides
	};
}

export function buildLeaderboardSnapshot(
	overrides: Partial<LeaderboardSnapshotResponsePayload> = {}
): LeaderboardSnapshotResponsePayload {
	return {
		guild_id: 'guild-123',
		leaderboard: [
			{ tag_number: 1, user_id: 'user-1', total_points: 1000, rounds_played: 12 },
			{ tag_number: 2, user_id: 'user-2', total_points: 950, rounds_played: 11 }
		],
		...overrides
	};
}

export function buildRoundListSnapshot(
	overrides: Partial<RoundListResponsePayload> = {}
): RoundListResponsePayload {
	return {
		rounds: [],
		profiles: {},
		...overrides
	};
}

export function buildTagListSnapshot(
	overrides: Partial<TagListResponsePayload> = {}
): TagListResponsePayload {
	return {
		guild_id: 'guild-123',
		members: [],
		...overrides
	};
}
