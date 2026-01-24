<script lang="ts">
	import { roundService } from '$lib/stores/round.svelte';
	import RoundListCard from './RoundListCard.svelte';

	type Props = {
		onSelect?: (roundId: string) => void;
	};

	let { onSelect }: Props = $props();

	// Group rounds by status using $derived
	let scheduledRounds = $derived(
		roundService.rounds
			.filter((r) => r.state === 'scheduled')
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
	);

	let activeRounds = $derived(roundService.rounds.filter((r) => r.state === 'started'));

	let completedRounds = $derived(
		roundService.rounds
			.filter((r) => r.state === 'finalized')
			.sort((a, b) => {
				// Sort by startTime descending (most recent first)
				return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
			})
			.slice(0, 10) // Last 10 completed
	);

	function handleSelect(roundId: string) {
		onSelect?.(roundId);
	}
</script>

<div class="round-list">
	<!-- Live Now Section -->
	{#if activeRounds.length > 0}
		<section class="round-section">
			<h2 class="section-title">Live Now</h2>
			<div class="round-grid">
				{#each activeRounds as round (round.id)}
					<RoundListCard {round} onclick={() => handleSelect(round.id)} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- Upcoming Section -->
	{#if scheduledRounds.length > 0}
		<section class="round-section">
			<h2 class="section-title">Upcoming</h2>
			<div class="round-grid">
				{#each scheduledRounds as round (round.id)}
					<RoundListCard {round} onclick={() => handleSelect(round.id)} />
				{/each}
			</div>
		</section>
	{:else if activeRounds.length === 0}
		<div class="empty-state">
			<p class="empty-text">No upcoming rounds scheduled</p>
		</div>
	{/if}

	<!-- Recent Section -->
	{#if completedRounds.length > 0}
		<section class="round-section">
			<h2 class="section-title">Recent</h2>
			<div class="round-grid">
				{#each completedRounds as round (round.id)}
					<RoundListCard {round} onclick={() => handleSelect(round.id)} />
				{/each}
			</div>
		</section>
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
		gap: 2rem;
		width: 100%;
	}

	.round-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--guild-text, #e5e7eb);
		margin: 0;
		padding: 0 0.5rem;
	}

	.round-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

	@media (max-width: 640px) {
		.round-grid,
		.loading-skeleton {
			grid-template-columns: 1fr;
		}
	}
</style>
