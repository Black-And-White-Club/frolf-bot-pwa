<script lang="ts">
	import Icon from './icons/Icon.svelte';

	// Reusable status badge component
	export let status: string;
	export let count: number | undefined;
	export let showCount: boolean = true;
	export let testid: string | undefined = undefined;

	// color to use for icon/border/text for a given status
	function getStatusColor(status: string) {
		switch (status) {
			case 'active': // Skobeloff
				return `rgb(var(--guild-primary-rgb))`;
			case 'completed': // Gold
				return `rgb(var(--guild-accent-rgb))`;
			case 'scheduled': // Amethyst
				return `rgb(var(--guild-secondary-rgb))`;
			case 'cancelled': // neutral
				return `rgb(var(--guild-text-secondary-rgb, 100, 116, 139))`;
			default:
				return 'rgb(161, 161, 170)'; // zinc-400 fallback
		}
	}

	function getStatusBgColor(status: string) {
		switch (status) {
			case 'active': // Skobeloff
				return 'rgba(var(--guild-primary-rgb), 0.1)';
			case 'completed': // Matte Gold
				return 'rgba(var(--guild-accent-rgb), 0.1)';
			case 'scheduled': // Amethyst
				return 'rgba(var(--guild-secondary-rgb), 0.1)';
			case 'cancelled': // Charcoal (neutral gray for cancelled)
				return 'rgba(var(--guild-text-rgb), 0.1)';
			default:
				return 'rgba(26, 26, 26, 0.1)';
		}
	}

	function getStatusAnimation(status: string) {
		switch (status) {
			case 'active':
				return ''; // No animation - keep subtle
			case 'completed':
				return ''; // Completed feels accomplished, no animation needed
			default:
				return '';
		}
	}

	$: displayText =
		showCount && count !== undefined
			? `${count} ${status}`
			: status.charAt(0).toUpperCase() + status.slice(1);
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md {getStatusAnimation(
		status
	)}"
	style="background-color: {getStatusBgColor(status)}; border: 1px solid {getStatusColor(
		status
	)}; color: {getStatusColor(status)};"
	data-testid={testid}
>
	<span class="icon text-sm" aria-hidden="true">
		{#if status === 'active'}
			<Icon name="target" size={16} />
		{:else if status === 'completed'}
			<Icon name="check" size={16} />
		{:else if status === 'scheduled'}
			<Icon name="calendar" size={16} />
		{:else if status === 'cancelled'}
			<Icon name="close" size={16} />
		{:else}
			<Icon name="info" size={16} />
		{/if}
	</span>
	<span>{displayText}</span>
</span>
