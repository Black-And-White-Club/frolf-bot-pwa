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

	let IconComponent = $derived(iconMap[icon]);
</script>

<div class="stat-card" data-testid={testid}>
	<div class="stat-content">
		<p class="stat-label">{label}</p>
		<p class="stat-value">{value}</p>
	</div>

	{#if IconComponent}
		<IconComponent
			withBg={true}
			bgColor={bgColorMap[color]}
			fgColor={colorMap[color]}
			boxSize="3rem"
			size="60%"
		/>
	{/if}
</div>

<style>
	.stat-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-radius: 0.75rem;
		padding: 0.55rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 1rem;
		font-weight: 700;
		color: var(--guild-text-secondary);
		line-height: 1.25;
	}

	.stat-value {
		display: flex;
		justify-content: center;
		font-size: 2rem;
		font-weight: 700;
		color: var(--guild-text);
	}

	@media (max-width: 640px) {
		.stat-card {
			padding: 1rem;
		}
	}
</style>
