import type { User, DashboardData, Round, LeaderboardEntry, UserStats } from '$lib/types/backend';

// Mock users
export const mockUsers: User[] = [
	{
		user_id: '123456789012345678',
		username: 'Sebastian',
		discriminator: '1234',
		avatar_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face',
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

// Mock rounds
const mockRounds: Round[] = [
	{
		round_id: 'round_001',
		guild_id: 'mock_guild_123',
		title: 'Weekly Disc Golf Tournament',
		description: 'Join us for our weekly tournament at the local course!',
		location: 'Riverside Park',
		start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
		status: 'scheduled',
		participants: [
			{
				user_id: '123456789012345678',
				username: 'Sebastian',
				response: 'yes',
				tag_number: 1
			},
			{
				user_id: '234567890123456789',
				username: 'Bob',
				response: 'yes',
				tag_number: 2
			}
		],
		created_by: '123456789012345678',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	},
	{
		round_id: 'round_002',
		guild_id: 'mock_guild_123',
		title: 'Casual Round',
		description: 'Just a casual round with friends',
		location: 'Downtown Course',
		start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
		status: 'active',
		participants: [
			{
				user_id: '123456789012345678',
				username: 'Sebastian',
				response: 'yes',
				tag_number: 1,
				score: 15
			},
			{
				user_id: '234567890123456789',
				username: 'Bob',
				response: 'yes',
				tag_number: 2,
				score: 18
			},
			{
				user_id: '345678901234567890',
				username: 'Charlie',
				response: 'yes',
				tag_number: 3,
				score: 20
			}
		],
		created_by: '234567890123456789',
		created_at: new Date(Date.now() - 7200000).toISOString(),
		updated_at: new Date().toISOString()
	},
	{
		round_id: 'round_003',
		guild_id: 'mock_guild_123',
		title: 'Last Week\'s Tournament',
		description: 'Great tournament last week!',
		location: 'Mountain View Course',
		start_time: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
		status: 'completed',
		participants: [
			{
				user_id: '123456789012345678',
				username: 'Alice',
				response: 'yes',
				tag_number: 1,
				score: -3
			},
			{
				user_id: '234567890123456789',
				username: 'Bob',
				response: 'yes',
				tag_number: 2,
				score: -1
			},
			{
				user_id: '345678901234567890',
				username: 'Charlie',
				response: 'yes',
				tag_number: 3,
				score: 2
			}
		],
		created_by: '123456789012345678',
		created_at: new Date(Date.now() - 691200000).toISOString(),
		updated_at: new Date(Date.now() - 604800000).toISOString()
	}
];

// Mock leaderboard
const mockLeaderboard: LeaderboardEntry[] = [
	{ tag_number: 1, user_id: '123456789012345678' },
	{ tag_number: 2, user_id: '234567890123456789' },
	{ tag_number: 3, user_id: '345678901234567890' }
];

// Mock API
export const mockAPI = {
	async getDashboard(): Promise<DashboardData> {
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 500));

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
