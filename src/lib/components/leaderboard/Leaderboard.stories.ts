import type { Meta, StoryObj } from '@storybook/svelte';
import Leaderboard from './Leaderboard.svelte';

// Relax the story typing to `any` because this codebase uses a non-standard
// props pattern (props extracted via $props()) which Storybook's type
// inference doesn't pick up. Using `Meta<any>` allows declaring `args`
// like `entries` without a TS error in stories.
const meta: Meta<any> = {
	title: 'Components/Leaderboard',
	component: Leaderboard,
	tags: ['autodocs'],
	argTypes: {
		entries: { control: 'object' },
		showRank: { control: 'boolean' },
		compact: { control: 'boolean' },
		onViewAll: { action: 'viewAll' }
	}
};

export default meta;
type Story = StoryObj<any>;

const mockEntries = [
	{ user_id: '1', tag_number: 42, username: 'Player 1' },
	{ user_id: '2', tag_number: 17, username: 'Player 2' },
	{ user_id: '3', tag_number: 88, username: 'Player 3' },
	{ user_id: '4', tag_number: 23, username: 'Player 4' },
	{ user_id: '5', tag_number: 99, username: 'Player 5' }
];

export const Default: Story = {
	args: {
		entries: mockEntries,
		showRank: true,
		compact: false
	}
};

export const Compact: Story = {
	args: {
		entries: mockEntries,
		showRank: true,
		compact: true
	}
};

export const WithViewAll: Story = {
	args: {
		entries: [...mockEntries, ...mockEntries], // 10 entries
		showRank: true,
		compact: false,
		onViewAll: () => console.log('View all clicked')
	}
};

export const Empty: Story = {
	args: {
		entries: [],
		showRank: true,
		compact: false
	}
};
