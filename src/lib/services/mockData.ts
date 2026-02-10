/**
 * Mock data service - generates fake backend responses for development
 * Structures match the Go backend event payloads
 */

import type {
	DiscordID,
	GuildID,
	RoundID,
	LeaderboardData,
	Round,
	User,
	DashboardData
} from '$lib/types/backend';

// ============ Helper Functions ============

function generateRoundID(): RoundID {
	return crypto.randomUUID();
}

// ============ Mock Users ============

export const mockUsers: User[] = [
	{
		user_id: '123456789012345678',
		username: 'Alice',
		avatar_url: 'https://i.pravatar.cc/150?img=1',
		guild_id: 'mock_guild_123',
		role: 'User',
		tag_number: 1,
		total_rounds: 15,
		best_score: 52,
		average_score: 58.3
	},
	{
		user_id: '234567890123456789',
		username: 'Bob',
		avatar_url: 'https://i.pravatar.cc/150?img=2',
		guild_id: 'mock_guild_123',
		role: 'User',
		tag_number: 2,
		total_rounds: 12,
		best_score: 55,
		average_score: 61.2
	},
	{
		user_id: '345678901234567890',
		username: 'Charlie',
		guild_id: 'mock_guild_123',
		role: 'Editor',
		tag_number: 3,
		total_rounds: 20,
		best_score: 49,
		average_score: 56.8
	},
	{
		user_id: '456789012345678901',
		username: 'Diana',
		avatar_url: 'https://i.pravatar.cc/150?img=4',
		guild_id: 'mock_guild_123',
		role: 'Admin',
		tag_number: 4,
		total_rounds: 25,
		best_score: 48,
		average_score: 54.1
	},
	{
		user_id: '567890123456789012',
		username: 'Eve',
		avatar_url: 'https://i.pravatar.cc/150?img=5',
		guild_id: 'mock_guild_123',
		role: 'User',
		tag_number: 5,
		total_rounds: 8,
		best_score: 60,
		average_score: 65.5
	}
];

// ============ Mock Leaderboard ============

export function getMockLeaderboard(): LeaderboardData {
	return mockUsers
		.filter((u) => u.tag_number)
		.map((u) => ({
			tag_number: u.tag_number!,
			user_id: u.user_id,
			total_points: (u.total_rounds || 0) * 100, // Mock calculation (not real logic)
			rounds_played: u.total_rounds || 0
		}))
		.sort((a, b) => a.tag_number - b.tag_number);
}

// ============ Mock Rounds ============

export const mockRounds: Round[] = [
	{
		round_id: generateRoundID(),
		guild_id: 'mock_guild_123',
		title: 'Saturday Morning Round',
		description: 'Casual morning disc golf at Lakeside',
		location: 'Lakeside Park DGC',
		start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
		status: 'scheduled',
		participants: [
			{
				user_id: mockUsers[0].user_id,
				username: mockUsers[0].username,
				avatar_url: mockUsers[0].avatar_url,
				response: 'yes',
				tag_number: 1
			},
			{
				user_id: mockUsers[1].user_id,
				username: mockUsers[1].username,
				avatar_url: mockUsers[1].avatar_url,
				response: 'yes',
				tag_number: 2
			},
			{
				user_id: mockUsers[2].user_id,
				username: mockUsers[2].username,
				response: 'maybe'
			}
		],
		created_by: mockUsers[0].user_id,
		created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString()
	},
	{
		round_id: generateRoundID(),
		guild_id: 'mock_guild_123',
		title: 'Weekly League - Round 3',
		location: 'Riverside Course',
		start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
		status: 'active',
		participants: [
			{
				user_id: mockUsers[0].user_id,
				username: mockUsers[0].username,
				avatar_url: mockUsers[0].avatar_url,
				response: 'yes',
				tag_number: 1,
				score: 54
			},
			{
				user_id: mockUsers[1].user_id,
				username: mockUsers[1].username,
				avatar_url: mockUsers[1].avatar_url,
				response: 'yes',
				tag_number: 2,
				score: 58
			},
			{
				user_id: mockUsers[3].user_id,
				username: mockUsers[3].username,
				avatar_url: mockUsers[3].avatar_url,
				response: 'yes',
				tag_number: 4,
				score: 52
			}
		],
		created_by: mockUsers[3].user_id,
		created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date().toISOString()
	},
	{
		round_id: generateRoundID(),
		guild_id: 'mock_guild_123',
		title: 'Sunday Tournament',
		description: 'Monthly club tournament',
		location: 'Hilltop DGC',
		start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
		status: 'completed',
		participants: [
			{
				user_id: mockUsers[0].user_id,
				username: mockUsers[0].username,
				avatar_url: mockUsers[0].avatar_url,
				response: 'yes',
				tag_number: 1,
				score: 56
			},
			{
				user_id: mockUsers[1].user_id,
				username: mockUsers[1].username,
				avatar_url: mockUsers[1].avatar_url,
				response: 'yes',
				tag_number: 2,
				score: 60
			},
			{
				user_id: mockUsers[2].user_id,
				username: mockUsers[2].username,
				response: 'yes',
				tag_number: 3,
				score: 55
			},
			{
				user_id: mockUsers[3].user_id,
				username: mockUsers[3].username,
				avatar_url: mockUsers[3].avatar_url,
				response: 'yes',
				tag_number: 4,
				score: 51
			}
		],
		created_by: mockUsers[3].user_id,
		created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
		updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
	}
];

// ============ Mock Dashboard Data ============

export function getMockDashboard(userId: DiscordID = mockUsers[0].user_id): DashboardData {
	const user = mockUsers.find((u) => u.user_id === userId) || mockUsers[0];

	return {
		user,
		stats: {
			user_id: user.user_id,
			total_rounds: user.total_rounds || 0,
			best_score: user.best_score,
			average_score: user.average_score,
			rounds_won: Math.floor((user.total_rounds || 0) * 0.2), // 20% win rate
			current_tag: user.tag_number
		},
		recent_rounds: mockRounds.slice(0, 3),
		leaderboard_preview: getMockLeaderboard().slice(0, 5)
	};
}

// ============ API Simulation ============

/**
 * Simulate async API call with delay
 */
async function simulateAPICall<T>(data: T, delay = 300): Promise<T> {
	await new Promise((resolve) => setTimeout(resolve, delay));
	return data;
}

// ============ Public Mock API ============

export const mockAPI = {
	async getDashboard(userId?: DiscordID): Promise<DashboardData> {
		return simulateAPICall(getMockDashboard(userId));
	},

	async getLeaderboard(_guildId: GuildID = 'mock_guild_123'): Promise<LeaderboardData> {
		void _guildId;
		return simulateAPICall(getMockLeaderboard());
	},

	async getRounds(_guildId: GuildID = 'mock_guild_123'): Promise<Round[]> {
		void _guildId;
		return simulateAPICall(mockRounds);
	},

	async getRound(roundId: RoundID): Promise<Round | null> {
		const round = mockRounds.find((r) => r.round_id === roundId);
		return simulateAPICall(round || null);
	},

	async getUser(userId: DiscordID): Promise<User | null> {
		const user = mockUsers.find((u) => u.user_id === userId);
		return simulateAPICall(user || null);
	}
};
