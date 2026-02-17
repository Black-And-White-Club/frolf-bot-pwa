<script lang="ts">
	import { roundService } from '$lib/stores/round.svelte';
	import RoundListCard from './RoundListCard.svelte';
	import RoundSection from './RoundSection.svelte';

	type Props = {
		onSelect?: (roundId: string) => void;
	};

	let { onSelect }: Props = $props();

	// Group rounds by status using $derived
	let scheduledRounds = $derived(roundService.upcomingRounds);

	let activeRounds = $derived(roundService.startedRounds);

	let completedRounds = $derived(roundService.recentCompletedRounds);

	function handleSelect(roundId: string) {
		onSelect?.(roundId);
	}
</script>

<div class="round-list">
	<!-- Active Rounds -->
	{#if activeRounds.length > 0}
		<RoundSection
			title="Live Rounds"
			badges={[{ label: 'Active', color: 'secondary' }]}
			initiallyCollapsed={false}
		>
			<div class="round-grid">
				{#each activeRounds as round (round.id)}
					<div class="round-card-wrapper glow-aura">
						<RoundListCard {round} onclick={() => handleSelect(round.id)} />
					</div>
				{/each}
			</div>
		</RoundSection>
	{/if}

	<!-- Scheduled Rounds -->
	{#if scheduledRounds.length > 0}
		<RoundSection
			title="Upcoming Rounds"
			badges={[{ label: `${scheduledRounds.length}`, color: 'secondary' }]}
			initiallyCollapsed={false}
		>
			<div class="round-grid">
				{#each scheduledRounds as round (round.id)}
					<RoundListCard {round} onclick={() => handleSelect(round.id)} />
				{/each}
			</div>
		</RoundSection>
	{/if}

	<!-- Completed Rounds -->
	{#if completedRounds.length > 0}
		<RoundSection title="Recent Rounds" initiallyCollapsed={false}>
			<div class="round-grid">
				{#each completedRounds as round (round.id)}
					<RoundListCard {round} onclick={() => handleSelect(round.id)} />
				{/each}
			</div>
		</RoundSection>
	{/if}

	<!-- Global Empty State -->
	{#if activeRounds.length === 0 && scheduledRounds.length === 0 && completedRounds.length === 0}
		{#if roundService.isLoading}
			<div class="loading-skeleton">
				<div class="skeleton-card"></div>
				<div class="skeleton-card"></div>
				<div class="skeleton-card"></div>
			</div>
		{:else}
			<div class="empty-state">
				<p class="empty-text">No rounds found</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.round-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}

	.round-grid {
		display: grid;
		gap: 1rem;
		/* Unified grid: auto-fit with min-width 280px */
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		width: 100%;
	}

	.round-card-wrapper {
		transition: transform 0.2s ease;
		border-radius: var(--border-radius-lg, 0.75rem);
	}

	.glow-aura {
		box-shadow: var(--guild-glow-aura, 0 0 15px rgba(139, 123, 184, 0.5));
		border: 1px solid rgba(139, 123, 184, 0.3);
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: 2rem;
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
	}

	.empty-text {
		color: var(--guild-text-muted, #9ca3af);
		font-size: 0.875rem;
		margin: 0;
	}

	.loading-skeleton {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	}

	.skeleton-card {
		height: 200px;
		background: linear-gradient(
			90deg,
			var(--guild-surface, #081212) 25%,
			var(--guild-surface-elevated, #0f1f1f) 50%,
			var(--guild-surface, #081212) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 0.75rem;
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
