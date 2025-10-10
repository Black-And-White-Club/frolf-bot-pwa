import type { Meta, StoryObj } from '@storybook/svelte';
import ScoreCard from './ScoreCard.svelte';

const meta: Meta<typeof ScoreCard> = {
	title: 'Components/ScoreCard',
	component: ScoreCard,
	argTypes: {
		playerName: { control: 'text' },
		score: { control: 'number' },
		par: { control: 'number' },
		holeNumber: { control: 'number' }
	}
};

export default meta;
type Story = StoryObj<typeof ScoreCard>;

export const UnderPar: Story = {
	args: {
		playerName: 'John Doe',
		score: 2,
		par: 3,
		holeNumber: 1,
		testid: 'scorecard-1-underpar'
	}
};

export const OverPar: Story = {
	args: {
		playerName: 'Jane Smith',
		score: 5,
		par: 3,
		holeNumber: 2,
		testid: 'scorecard-2-overpar'
	}
};

export const EvenPar: Story = {
	args: {
		playerName: 'Bob Johnson',
		score: 3,
		par: 3,
		holeNumber: 3,
		testid: 'scorecard-3-evenpar'
	}
};

export const Birdie: Story = {
	args: {
		playerName: 'Alice Green',
		score: 2,
		par: 3,
		holeNumber: 4,
		testid: 'scorecard-4-birdie'
	}
};

export const Eagle: Story = {
	args: {
		playerName: 'Charlie Blue',
		score: 1,
		par: 3,
		holeNumber: 5,
		testid: 'scorecard-5-eagle'
	}
};

export const Bogey: Story = {
	args: {
		playerName: 'Diana Red',
		score: 4,
		par: 3,
		holeNumber: 6,
		testid: 'scorecard-6-bogey'
	}
};

export const DoubleBogey: Story = {
	args: {
		playerName: 'Eve Yellow',
		score: 5,
		par: 3,
		holeNumber: 7,
		testid: 'scorecard-7-doublebogey'
	}
};

export const HoleInOne: Story = {
	args: {
		playerName: 'Frank Purple',
		score: 1,
		par: 4,
		holeNumber: 8,
		testid: 'scorecard-8-holeinone'
	}
};
