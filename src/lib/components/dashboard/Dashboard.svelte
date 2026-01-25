<script lang="ts">
	import { roundService } from '$lib/stores/round.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import RoundListCompact from '$lib/components/round/RoundListCompact.svelte';
	import LeaderboardCompact from '$lib/components/leaderboard/LeaderboardCompact.svelte';
	import LiveIndicator from '$lib/components/general/LiveIndicator.svelte';
	import ConnectionStatus from '$lib/components/general/ConnectionStatus.svelte';
	import LoadingSkeleton from '$lib/components/general/LoadingSkeleton.svelte';
	import EmptyState from '$lib/components/general/EmptyState.svelte';

	let { mode = 'default' }: { mode?: 'default' | 'tv' | 'compact' } = $props();

	const activeRounds = $derived(
		roundService.rounds.filter((r) => r.state === 'started' || r.state === 'scheduled')
	);
</script>

<div class="dashboard" class:tv-mode={mode === 'tv'} class:compact-mode={mode === 'compact'}>
	<header class="dashboard-header">
		<div class="flex items-center gap-2">
			<h1 class="text-xl font-bold text-slate-100">Frolf Bot</h1>
			<LiveIndicator active={activeRounds.length > 0} />
		</div>
		<ConnectionStatus />
	</header>

	<div class="dashboard-grid">
		<!-- Rounds Panel -->
		<section class="panel rounds-panel">
			<h2 class="panel-title">Rounds</h2>
			{#if roundService.isLoading}
				<LoadingSkeleton variant="card" count={3} />
			{:else if roundService.rounds.length === 0}
				<EmptyState icon="🥏" title="No rounds" message="Waiting for round events" />
			{:else}
				<RoundListCompact rounds={roundService.rounds} />
			{/if}
		</section>

		<!-- Leaderboard Panel -->
		<section class="panel leaderboard-panel">
			<h2 class="panel-title">Leaderboard</h2>
			{#if leaderboardService.isLoading}
				<LoadingSkeleton variant="row" count={10} />
			{:else if leaderboardService.entries.length === 0}
				<EmptyState icon="🏆" title="No rankings" message="Waiting for leaderboard data" />
			{:else}
				<LeaderboardCompact
					entries={leaderboardService.entries}
					limit={mode === 'tv' ? 20 : 10}
				/>
			{/if}
		</section>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		gap: 1rem;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		flex: 1;
		overflow: hidden;
	}

	.panel {
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
		padding: 1rem;
		overflow-y: auto;
	}

	.panel-title {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--guild-text-muted, #9ca3af);
		margin-bottom: 0.75rem;
	}

	/* TV/Kiosk Mode - Portrait optimized */
	.tv-mode {
		padding: 1.5rem;
	}

	.tv-mode .dashboard-grid {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1.5fr;
	}

	.tv-mode .panel-title {
		font-size: 1rem;
	}

	/* Compact Mode - Mobile */
	.compact-mode .dashboard-grid {
		grid-template-columns: 1fr;
	}

	@media (max-width: 768px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
