import type { Meta, StoryObj } from '@storybook/svelte';
import Leaderboard from './Leaderboard.svelte';

const meta: Meta<Leaderboard> = {
	title: 'Components/Leaderboard',
	component: Leaderboard,
	argTypes: {
		entries: { control: 'object' }
	}
};

export default meta;
type Story = StoryObj<Leaderboard>;

export const Empty: Story = {
	args: {
		entries: []
	}
};

export const WithPlayers: Story = {
	args: {
		entries: [
			{ tag_number: 1, user_id: 'user-1' },
			{ tag_number: 2, user_id: 'user-2' },
			{ tag_number: 3, user_id: 'user-3' },
			{ tag_number: 4, user_id: 'user-4' }
		]
	}
};

export const SinglePlayer: Story = {
	args: {
		entries: [
			{ tag_number: 7, user_id: 'solo-1' }
		]
	}
};
