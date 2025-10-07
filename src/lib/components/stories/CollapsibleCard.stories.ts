import CollapsibleCard from '$lib/components/CollapsibleCard.svelte';

const header = () => {
	return { default: () => 'Section Title' };
};

const children = () => {
	return { default: () => 'Collapsible content goes here.' };
};

export default {
	title: 'Components/CollapsibleCard',
	component: CollapsibleCard
};

export const Default = {
	args: {
		testid: 'demo-collapsible',
		controlWidth: '6.25rem',
		header,
		children
	}
};
