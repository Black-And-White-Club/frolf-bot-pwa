import type { Meta, StoryObj } from '@storybook/svelte';
import LeaderboardWrapper from './LeaderboardWrapper.svelte';

const meta: Meta = {
	title: 'Example/LeaderboardPreview',
	component: LeaderboardWrapper
};

export default meta;
type Story = StoryObj<typeof LeaderboardWrapper>;

export const Default: Story = {};
