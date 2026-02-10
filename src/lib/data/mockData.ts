import type { User, DashboardData, LeaderboardData, LeaderboardEntryRaw, UserStats } from '$lib/types/backend';
import { mockRounds } from '$lib/mocks/mockRounds';

// Mock users
export const mockUsers: User[] = [
	{
		user_id: '123456789012345678',
		username: 'Sebastian',
		discriminator: '1234',
		avatar_url:
			'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face&auto=format&q=60',
		guild_id: 'mock_guild_123',
		role: 'User',
		tag_number: 1,
		total_rounds: 15,
		total_score: 225,
		best_score: -3,
		average_score: 15.0
	},
	{
		user_id: '234567890123456789',
		username: 'Bob',
		discriminator: '5678',
		avatar_url: undefined,
		guild_id: 'mock_guild_123',
		role: 'User',
		tag_number: 2,
		total_rounds: 12,
		total_score: 198,
		best_score: -1,
		average_score: 16.5
	},
	{
		user_id: '345678901234567890',
		username: 'Charlie',
		discriminator: '9012',
		avatar_url: undefined,
		guild_id: 'mock_guild_123',
		role: 'User',
		tag_number: 3,
		total_rounds: 10,
		total_score: 180,
		best_score: 2,
		average_score: 18.0
	}
];

// Mock rounds - using imported mock data

// Mock leaderboard
const mockLeaderboard: LeaderboardEntryRaw[] = [
	{ tag_number: 1, user_id: '123456789012345678', total_points: 1500, rounds_played: 15 },
	{ tag_number: 2, user_id: '234567890123456789', total_points: 1200, rounds_played: 12 },
	{ tag_number: 3, user_id: '345678901234567890', total_points: 1000, rounds_played: 10 }
];

// Mock API
export const mockAPI = {
	async getDashboard(): Promise<DashboardData> {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 500));

		const currentUser = mockUsers[0];
		const userStats: UserStats = {
			user_id: currentUser.user_id,
			total_rounds: currentUser.total_rounds || 0,
			best_score: currentUser.best_score,
			average_score: currentUser.average_score,
			worst_score: 25, // Mock worst score
			rounds_won: 3,
			current_tag: currentUser.tag_number
		};

		return {
			user: currentUser,
			stats: userStats,
			recent_rounds: mockRounds,
			leaderboard_preview: mockLeaderboard
		};
	}
};
