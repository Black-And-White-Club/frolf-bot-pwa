<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import RoundCard from '$lib/components/round/RoundCard.svelte';

	type Badge = {
		label: string;
		color: 'primary' | 'secondary' | 'accent';
	};

	type Props = {
		title: string;
		rounds: Round[];
		badges?: Badge[];
		showDescription?: boolean;
		onRoundClick: (payload: { roundId: string }) => void;
		controlWidth?: string;
	};

	let {
		title,
		rounds,
		badges = [],
		showDescription = true,
		onRoundClick,
		controlWidth
	}: Props = $props();

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

<div class="rounds-section" data-testid={`rounds-section-${title}`}>
	<div class="section-header">
		<h2 class="card-title card-title--skobeloff">{title}</h2>
		{#if badges.length > 0}
			<div class="badges">
				{#each badges as badge}
					<span
						class="badge"
						style="
							background-color: {bgColorMap[badge.color]};
							border: 1px solid {colorMap[badge.color]};
						"
					>
						{badge.label}
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<div class="rounds-list">
		{#each rounds as round}
			<RoundCard
				{round}
				{onRoundClick}
				showStatus={true}
				compact={false}
				{showDescription}
				showLocation={true}
				dataTestId={`round-card-${round.round_id}`}
			/>
		{/each}
	</div>
</div>

<style>
	.rounds-section {
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.3s;
	}

	.rounds-section:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	/* Prevent badges from wrapping beneath the title on small screens */
	.section-header .badges {
		flex-wrap: nowrap;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.section-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--guild-text);
		margin: 0;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 9999px;
		white-space: nowrap;
		color: var(--guild-text);
	}

	.rounds-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
