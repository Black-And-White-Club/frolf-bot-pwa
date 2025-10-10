import type { Meta, StoryObj } from '@storybook/svelte';
import RoundCard from './RoundCard.svelte';
import type { Round } from '$lib/types/backend';

const meta: Meta<typeof RoundCard> = {
	title: 'Components/RoundCard',
	component: RoundCard,
	tags: ['autodocs'],
	argTypes: {
		onRoundClick: { action: 'roundClick' },
		showStatus: { control: 'boolean' },
		compact: { control: 'boolean' }
	}
};

export default meta;

type Story = StoryObj<typeof RoundCard>;

const mockRound: Round = {
	round_id: 'round_123',
	guild_id: 'guild_123',
	title: 'Saturday Morning League',
	description: 'Join us for a fun round at the local course! All skill levels welcome.',
	location: 'Mint Creek Park',
	start_time: new Date().toISOString(),
	status: 'active',
	participants: [
		{ user_id: '1', username: 'Jace', response: 'yes', score: 54 },
		{ user_id: '2', username: 'Ava', response: 'yes', score: 57 },
		{ user_id: '3', username: 'Sam', response: 'maybe', score: 60 },
		{ user_id: '4', username: 'Taylor', response: 'yes', score: undefined },
		{ user_id: '5', username: 'Morgan', response: 'no', score: undefined }
	],
	created_by: '1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString()
};

export const Default: Story = {
	args: {
		round: mockRound,
		showStatus: true,
		compact: false,
		dataTestId: 'round-card-round_123'
	}
};

export const Compact: Story = {
	args: {
		round: mockRound,
		showStatus: true,
		compact: true,
		dataTestId: 'round-card-round_123-compact'
	}
};

export const NoStatus: Story = {
	args: {
		round: mockRound,
		showStatus: false,
		compact: false,
		dataTestId: 'round-card-round_123-nostatus'
	}
};
