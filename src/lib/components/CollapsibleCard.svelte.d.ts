declare module '$lib/components/CollapsibleCard.svelte' {
	import { SvelteComponentTyped } from 'svelte';

	export interface CollapsibleCardProps {
		startCollapsed?: boolean;
		collapsed?: boolean;
		onToggle?: (collapsed: boolean) => void;
		testid?: string;
		class?: string;
		style?: string;
		header?: (...args: unknown[]) => unknown;
		children?: (...args: unknown[]) => unknown;
		controlWidth?: string;
	}

	export default class CollapsibleCard extends SvelteComponentTyped<
		CollapsibleCardProps,
		Record<string, unknown>,
		{ default: Record<string, unknown>; header: Record<string, unknown> }
	> {}
}
