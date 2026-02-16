import type { LeaderboardEntry, LeaderboardSnapshot } from '$lib/stores/leaderboard.svelte';

export const mockLeaderboardEntries: LeaderboardEntry[] = [
	{
		userId: '1',
		displayName: 'Jake "Ace" Thompson',
		tagNumber: 1,
		previousTagNumber: 1,
		totalPoints: 1500,
		roundsPlayed: 15
	},
	{
		userId: '2',
		displayName: 'Sarah Chen',
		tagNumber: 2,
		previousTagNumber: 3,
		totalPoints: 1200,
		roundsPlayed: 12
	},
	{
		userId: '3',
		displayName: 'Mike Rodriguez',
		tagNumber: 3,
		previousTagNumber: 2,
		totalPoints: 1000,
		roundsPlayed: 10
	},
	{
		userId: '4',
		displayName: 'Emma Wilson',
		tagNumber: 4,
		previousTagNumber: 6,
		totalPoints: 900,
		roundsPlayed: 9
	},
	{
		userId: '5',
		displayName: 'Chris Park',
		tagNumber: 5,
		previousTagNumber: 5,
		totalPoints: 850,
		roundsPlayed: 8
	},
	{
		userId: '6',
		displayName: 'Alex Martinez',
		tagNumber: 6,
		previousTagNumber: 4,
		totalPoints: 800,
		roundsPlayed: 8
	},
	{
		userId: '7',
		displayName: 'Jordan Lee',
		tagNumber: 7,
		previousTagNumber: 8,
		totalPoints: 750,
		roundsPlayed: 7
	},
	{
		userId: '8',
		displayName: 'Taylor Swift',
		tagNumber: 8,
		previousTagNumber: 8,
		totalPoints: 700,
		roundsPlayed: 7
	},
	{
		userId: '9',
		displayName: 'Casey Jones',
		tagNumber: 9,
		previousTagNumber: 12,
		totalPoints: 650,
		roundsPlayed: 6
	},
	{
		userId: '10',
		displayName: 'Riley Brown',
		tagNumber: 10,
		previousTagNumber: 9,
		totalPoints: 600,
		roundsPlayed: 6
	},
	{
		userId: '11',
		displayName: 'Morgan Davis',
		tagNumber: 11,
		previousTagNumber: 11,
		totalPoints: 550,
		roundsPlayed: 5
	},
	{
		userId: '12',
		displayName: 'Drew Miller',
		tagNumber: 12,
		previousTagNumber: 9,
		totalPoints: 500,
		roundsPlayed: 5
	}
];

export const mockLeaderboardSnapshot: LeaderboardSnapshot = {
	id: 'mock-snapshot-1',
	guildId: 'guild-123',
	version: 1,
	lastUpdated: new Date().toISOString(),
	entries: mockLeaderboardEntries
};
