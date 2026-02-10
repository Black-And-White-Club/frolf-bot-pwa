/**
 * TypeScript types matching the Go backend structures
 * from frolf-bot-shared/types and frolf-bot-shared/events
 */

// ============ Shared Types ============

export type DiscordID = string; // Discord snowflake ID
export type GuildID = string;
export type RoundID = string; // UUID
export type TagNumber = number; // 1-200
export type Score = number;

export interface GuildInfo {
	id: string;
	name: string;
	icon?: string;
}

export type UserRoleEnum = '' | 'User' | 'Editor' | 'Admin';

export type ServiceUpdateSource = 'round' | 'manual' | 'system';

// ============ Leaderboard Types ============

export interface LeaderboardEntryDTO {
	tag_number: TagNumber;
	user_id: DiscordID;
	total_points: number;
	rounds_played: number;
}

export type LeaderboardData = LeaderboardEntryDTO[];

export interface GetLeaderboardResponsePayload {
	guild_id: GuildID;
	leaderboard: LeaderboardData;
}

// ============ Round Types ============

export type RoundStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type ParticipantResponse = 'yes' | 'no' | 'maybe' | 'late';

export interface Participant {
	user_id: DiscordID;
	username: string;
	avatar_url?: string;
	response: ParticipantResponse;
	tag_number?: TagNumber;
	score?: Score;
	joined_late?: boolean;
}

export interface Round {
	round_id: RoundID;
	guild_id: GuildID;
	title: string;
	description?: string;
	location?: string;
	start_time?: string; // ISO 8601
	status: RoundStatus;
	// optional course par (total) for displaying golf-style scores in UI
	par_total?: number;
	// legacy or alternate name
	par?: number;
	participants: Participant[];
	event_message_id?: string;
	channel_id?: string;
	created_by: DiscordID;
	created_at: string;
	updated_at: string;
}

export interface RoundScheduledPayload {
	guild_id: GuildID;
	round_id: RoundID;
	title: string;
	description?: string;
	location?: string;
	start_time?: string;
	user_id: DiscordID;
	participants: Participant[];
	event_message_id?: string;
	channel_id?: string;
}

export interface RoundFinalizedPayload {
	guild_id: GuildID;
	round_id: RoundID;
	title: string;
	start_time?: string;
	location?: string;
	participants: Participant[];
	event_message_id?: string;
	discord_channel_id?: string;
}

// ============ User Types ============

export interface User {
	user_id: DiscordID;
	username: string;
	discriminator?: string;
	avatar_url?: string;
	guild_id: GuildID;
	role: UserRoleEnum;
	tag_number?: TagNumber;
	total_rounds?: number;
	total_score?: Score;
	best_score?: Score;
	average_score?: number;
}

// Lightweight session representation used in frontend tests/fixtures.
// The backend doesn't necessarily provide this shape, but tests and the
// frontend expect a small session object containing a user and token.
export interface Session {
	// session user: require minimal id/name compatible with frontend auth store
	user: (Partial<User> & { user_id?: string; username?: string }) & {
		// required for the frontend AuthStore shape
		id: string;
		name: string;
	};
	token: string;
	[key: string]: any;
}

// ============ Score Types ============

export interface ScoreEntry {
	user_id: DiscordID;
	username: string;
	tag_number?: TagNumber;
	score: Score;
	round_id: RoundID;
	submitted_at?: string;
}

// ============ Stats/Dashboard Types ============

export interface UserStats {
	user_id: DiscordID;
	total_rounds: number;
	best_score?: Score;
	average_score?: number;
	worst_score?: Score;
	rounds_won: number;
	current_tag?: TagNumber;
}

export interface DashboardData {
	user: User;
	stats: UserStats;
	recent_rounds: Round[];
	leaderboard_preview: LeaderboardEntryDTO[];
}
