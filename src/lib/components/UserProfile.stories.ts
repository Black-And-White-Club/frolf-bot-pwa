import type { Meta, StoryObj } from '@storybook/svelte';
import UserProfile from './UserProfile.svelte';

const meta: Meta<UserProfile> = {
	title: 'Components/UserProfile',
	component: UserProfile,
	argTypes: {
		user: { control: 'object' }
	}
};

export default meta;
type Story = StoryObj<UserProfile>;

export const WithStats: Story = {
	args: {
		user: {
			user_id: 'user-1',
			username: 'John Doe',
			avatar_url: 'https://via.placeholder.com/48',
			guild_id: 'guild-1',
			role: 'User',
			total_rounds: 15,
			best_score: 35,
			average_score: 42.5
		}
	}
};

export const WithoutAvatar: Story = {
	args: {
		user: {
			user_id: 'user-2',
			username: 'Jane Smith',
			guild_id: 'guild-1',
			role: 'User',
			total_rounds: 8,
			best_score: 38,
			average_score: 45.2
		}
	}
};

export const NewPlayer: Story = {
	args: {
		user: {
			user_id: 'user-3',
			username: 'Bob Johnson',
			guild_id: 'guild-1',
			role: 'User',
			total_rounds: 0
		}
	}
};

export const VeteranPlayer: Story = {
	args: {
		user: {
			user_id: 'user-4',
			username: 'Alice Green',
			avatar_url: 'https://via.placeholder.com/48',
			guild_id: 'guild-1',
			role: 'User',
			total_rounds: 50,
			best_score: 30,
			average_score: 39.8
		}
	}
};
