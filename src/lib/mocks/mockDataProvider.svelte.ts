import { roundService } from '$lib/stores/round.svelte';
import { leaderboardService } from '$lib/stores/leaderboard.svelte';
import { userProfiles } from '$lib/stores/userProfiles.svelte'; // Added
import { tagStore } from '$lib/stores/tags.svelte'; // Added
import { clubService } from '$lib/stores/club.svelte'; // Added
import { mockLeaderboardSnapshot, mockLeaderboardEntries } from './mockLeaderboard'; // Added entries

/**
 * Mock Data Provider for Development Mode
 * Simulates NATS events without requiring live connection
 */

// Mock rounds matching round.svelte.ts types
const mockRounds = [
	{
		id: 'round-1',
		guildId: 'guild-123',
		title: 'Morning Disc Golf Session',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.',
		location: 'Riverside Park Disc Golf Course',
		startTime: '2025-10-05T09:00:00Z',
		state: 'scheduled' as const,
		createdBy: 'user-1',
		eventMessageId: 'msg-123',
		participants: [
			{
				userId: 'user-1',
				response: 'accepted' as const,
				score: null,
				tagNumber: 42
			},
			{
				userId: 'user-2',
				response: 'accepted' as const,
				score: null,
				tagNumber: 17
			},
			{
				userId: 'user-3',
				response: 'tentative' as const,
				score: null,
				tagNumber: 88
			}
		]
	},
	{
		id: 'round-2',
		guildId: 'guild-123',
		title: 'Evening Classic',
		description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		location: 'Downtown Disc Park',
		startTime: '2025-10-04T18:30:00Z',
		state: 'started' as const,
		createdBy: 'user-2',
		eventMessageId: 'msg-456',
		participants: [
			{
				userId: 'user-1',
				response: 'accepted' as const,
				score: null,
				tagNumber: 42
			},
			{
				userId: 'user-2',
				response: 'accepted' as const,
				score: 57,
				tagNumber: 17
			},
			{
				userId: 'user-4',
				response: 'accepted' as const,
				score: 52,
				tagNumber: 23
			},
			{
				userId: 'user-5',
				response: 'accepted' as const,
				score: 54,
				tagNumber: 7
			}
		]
	},
	{
		id: 'round-3',
		guildId: 'guild-123',
		title: 'Weekend Championship',
		description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		location: 'Mountain View Championship Course',
		startTime: '2025-10-03T14:00:00Z',
		state: 'finalized' as const,
		createdBy: 'user-1',
		eventMessageId: 'msg-789',
		participants: [
			{
				userId: 'user-1',
				response: 'accepted' as const,
				score: 38,
				tagNumber: 42
			},
			{
				userId: 'user-2',
				response: 'accepted' as const,
				score: 41,
				tagNumber: 17
			},
			{
				userId: 'user-6',
				response: 'accepted' as const,
				score: 44,
				tagNumber: 99
			},
			{
				userId: 'user-7',
				response: 'accepted' as const,
				score: 39,
				tagNumber: 12
			},
			{
				userId: 'user-8',
				response: 'accepted' as const,
				score: 46,
				tagNumber: 55
			}
		]
	}
];

class MockDataProvider {
	private intervalId: ReturnType<typeof setInterval> | null = null;
	enabled = $state(false);

	start(): void {
		if (this.enabled) return;
		this.enabled = true;

		// Load initial mock data
		mockRounds.forEach((round) => roundService.addRound(round));
		leaderboardService.setSnapshot(mockLeaderboardSnapshot);

		// Populate mock club info
		clubService.info = {
			id: 'guild-123',
			name: 'Black & White Club',
			icon: 'https://cdn.discordapp.com/icons/123456789/abcdef.png'
		};
		clubService.knownClubs['guild-123'] = clubService.info;
		
		// Populate mock profiles
		const profiles: Record<string, any> = {};
		
		// From leaderboard
		mockLeaderboardEntries.forEach(entry => {
			profiles[entry.userId] = {
				user_id: entry.userId,
				display_name: entry.displayName || `User ${entry.userId}`,
				avatar_url: `https://cdn.discordapp.com/embed/avatars/${Number(entry.userId) % 5}.png`
			};
		});

		// From rounds (ensure participants have profiles)
		mockRounds.forEach(round => {
			round.participants.forEach(p => {
				if (!profiles[p.userId]) {
					profiles[p.userId] = {
						user_id: p.userId,
						display_name: `Player ${p.userId}`,
						avatar_url: `https://cdn.discordapp.com/embed/avatars/${Number(p.userId) % 5}.png`
					};
				}
			});
			// Creator
			if (!profiles[round.createdBy]) {
				profiles[round.createdBy] = {
					user_id: round.createdBy,
					display_name: `Creator ${round.createdBy}`,
					avatar_url: `https://cdn.discordapp.com/embed/avatars/0.png`
				};
			}
		});

		userProfiles.setProfilesFromApi(profiles);

		// Populate mock tags
		const mockTags = mockLeaderboardEntries.map(e => ({
			member_id: e.userId,
			current_tag: e.tagNumber,
			last_active_at: new Date().toISOString()
		}));

		tagStore.applyTagListResponse({
			guild_id: 'guild-123',
			members: mockTags
		});

		roundService.isLoading = false;
		leaderboardService.isLoading = false;
		tagStore.setLoading(false); // Ensure tag store is ready

		// Simulate periodic updates (optional)
		this.intervalId = setInterval(() => {
			this.simulateUpdate();
		}, 30000); // Every 30 seconds
	}

	stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.enabled = false;
	}

	private simulateUpdate(): void {
		// Randomly update a leaderboard entry's movement
		if (!leaderboardService.snapshot) return;

		const entries = [...leaderboardService.entries];
		const idx = Math.floor(Math.random() * entries.length);
		const entry = entries[idx];

		leaderboardService.applyPatch({
			op: 'upsert_entry',
			entry: {
				...entry,
				previousTagNumber: entry.tagNumber,
				tagNumber: Math.max(1, entry.tagNumber + (Math.floor(Math.random() * 5) - 2))
			}
		});
	}
}

export const mockDataProvider = new MockDataProvider();
