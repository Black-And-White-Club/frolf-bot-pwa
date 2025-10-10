<script lang="ts">
	import ActiveRounds from '$lib/components/icons/ActiveRounds.svelte';
	import Scheduled from '$lib/components/icons/Scheduled.svelte';
	import Completed from '$lib/components/icons/Completed.svelte';
	import TotalPlayers from '$lib/components/icons/TotalPlayers.svelte';

	type Props = {
		label: string;
		value: number;
		icon: 'active' | 'scheduled' | 'completed' | 'players';
		color: 'primary' | 'secondary' | 'accent';
		testid?: string;
	};

	let { label, value, icon, color, testid }: Props = $props();

	const iconMap = {
		active: ActiveRounds,
		scheduled: Scheduled,
		completed: Completed,
		players: TotalPlayers
	};

	let IconComponent = $derived(iconMap[icon]);

	const colorMap = {
		primary: 'var(--guild-primary)',
		secondary: 'var(--guild-secondary)',
		accent: 'var(--guild-accent)'
	};

	const bgColorMap = {
		primary: 'rgba(var(--guild-primary-rgb, 0, 116, 116), 0.1)',
		secondary: 'rgba(var(--guild-secondary-rgb, 139, 123, 184), 0.1)',
		accent: 'rgba(var(--guild-accent-rgb, 203, 165, 53), 0.1)'
	};
</script>

<div class="stat-card" data-testid={testid}>
	<div class="stat-content">
		<p class="stat-label">{label}</p>
		<p class="stat-value">{value}</p>
	</div>
	<div class="stat-icon" style="background-color: {bgColorMap[color]};">
		{#if IconComponent}
			<div class="icon" style="color: {colorMap[color]};">
				<IconComponent />
			</div>
		{:else}
			<div class="icon-fallback" style="color: {colorMap[color]};"></div>
		{/if}
	</div>
</div>

<style>
	.stat-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-radius: 0.75rem;
		padding: 1rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--guild-text-secondary);
		margin: 0;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--guild-text);
		margin: 0.25rem 0 0;
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		flex-shrink: 0;
		.icon {
			width: 1.25rem;
			height: 1.25rem;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.icon > :global(svg) {
			width: 100%;
			height: 100%;
		}

		.icon-fallback {
			width: 1.25rem;
			height: 1.25rem;
			border-radius: 50%;
			background: currentColor;
		}
		background: currentColor;
	}
</style>
