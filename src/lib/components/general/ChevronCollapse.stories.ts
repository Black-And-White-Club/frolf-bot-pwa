import ChevronCollapse from './ChevronCollapse.svelte';

export default {
	title: 'Components/ChevronCollapse',
	component: ChevronCollapse
};

export const Default = {
	args: {
		collapsed: true,
		disabled: false,
		ariaLabel: 'Toggle'
	}
};

export const Expanded = {
	args: {
		collapsed: false,
		disabled: false,
		ariaLabel: 'Toggle'
	}
};
