import type { Round } from '$lib/types/backend';

/**
 * Mock data for rounds to demonstrate the RoundCard component
 */

export const mockRounds: Round[] = [
	{
		round_id: 'round-1',
		guild_id: 'guild-123',
		title: 'Morning Disc Golf Session',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.',
		location: 'Riverside Park Disc Golf Course',
		start_time: '2025-10-05T09:00:00Z',
		status: 'scheduled',
		par_total: 54,
		participants: [
			{
				user_id: 'user-1',
				username: 'Alice',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar1.png',
				response: 'yes',
				tag_number: 42
			},
			{
				user_id: 'user-2',
				username: 'Bob',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar2.png',
				response: 'yes',
				tag_number: 17
			},
			{
				user_id: 'user-3',
				username: 'Charlie',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar3.png',
				response: 'maybe',
				tag_number: 88
			}
		],
		event_message_id: 'msg-123',
		channel_id: 'channel-456',
		created_by: 'user-1',
		created_at: '2025-10-04T10:00:00Z',
		updated_at: '2025-10-04T10:00:00Z'
	},
	{
		round_id: 'round-2',
		guild_id: 'guild-123',
		title: 'Evening Classic',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
		location: 'Downtown Disc Park',
		start_time: '2025-10-04T18:30:00Z',
		status: 'active',
		par_total: 54,
		participants: [
			{
				user_id: 'user-1',
				username: 'Alice',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar1.png',
				response: 'yes',
				tag_number: 42
				// no score yet for Alice (still playing)
			},
			{
				user_id: 'user-2',
				username: 'Bob',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar2.png',
				response: 'yes',
				tag_number: 17,
				score: 57 // +3 vs par_total 54
			},
			{
				user_id: 'user-4',
				username: 'Diana',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar4.png',
				response: 'late',
				tag_number: 23,
				score: 52, // -2 vs par_total 54
				joined_late: true
			},
			{
				user_id: 'user-5',
				username: 'Eve',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar5.png',
				response: 'yes',
				tag_number: 7,
				score: 54 // E vs par_total 54
			}
		],
		event_message_id: 'msg-456',
		channel_id: 'channel-789',
		created_by: 'user-2',
		created_at: '2025-10-03T15:00:00Z',
		updated_at: '2025-10-04T18:35:00Z'
	},
	{
		round_id: 'round-3',
		guild_id: 'guild-123',
		title: 'Weekend Championship',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque velit nisi, pretium ut lacinia in, elementum id enim.',
		location: 'Mountain View Championship Course',
		start_time: '2025-10-03T14:00:00Z',
		status: 'completed',
		par_total: 41,
		participants: [
			{
				user_id: 'user-1',
				username: 'Alice',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar1.png',
				response: 'yes',
				tag_number: 42,
				score: 38 // -3 vs par 41
			},
			{
				user_id: 'user-2',
				username: 'Bob',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar2.png',
				response: 'yes',
				tag_number: 17,
				score: 41 // E
			},
			{
				user_id: 'user-6',
				username: 'Frank',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar6.png',
				response: 'yes',
				tag_number: 99,
				score: 44
			},
			{
				user_id: 'user-7',
				username: 'Grace',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar7.png',
				response: 'yes',
				tag_number: 12,
				score: 39
			},
			{
				user_id: 'user-8',
				username: 'Henry',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar8.png',
				response: 'yes',
				tag_number: 55,
				score: 46 // +5 vs par 41
			}
		],
		event_message_id: 'msg-789',
		channel_id: 'channel-101',
		created_by: 'user-1',
		created_at: '2025-10-01T09:00:00Z',
		updated_at: '2025-10-03T16:30:00Z'
	},
	{
		round_id: 'round-4',
		guild_id: 'guild-123',
		title: 'Practice Round',
		description: 'Low-key practice session for beginners and experienced players.',
		location: 'Community Park',
		start_time: '2025-10-06T16:00:00Z',
		status: 'cancelled',
		participants: [
			{
				user_id: 'user-3',
				username: 'Charlie',
				avatar_url: 'https://cdn.discordapp.com/avatars/123456789/avatar3.png',
				response: 'yes',
				tag_number: 88
			}
		],
		event_message_id: 'msg-999',
		channel_id: 'channel-202',
		created_by: 'user-3',
		created_at: '2025-10-04T12:00:00Z',
		updated_at: '2025-10-04T13:00:00Z'
	}
];
