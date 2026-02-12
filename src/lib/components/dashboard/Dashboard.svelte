<script lang="ts">
	import { roundService } from '$lib/stores/round.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { appInit } from '$lib/stores/init.svelte';
	import { clubService } from '$lib/stores/club.svelte';
	import RoundListCompact from '$lib/components/round/RoundListCompact.svelte';
	import LeaderboardCompact from '$lib/components/leaderboard/LeaderboardCompact.svelte';
	import LiveIndicator from '$lib/components/general/LiveIndicator.svelte';
	import ConnectionStatus from '$lib/components/general/ConnectionStatus.svelte';
	import LoadingSkeleton from '$lib/components/general/LoadingSkeleton.svelte';
	import EmptyState from '$lib/components/general/EmptyState.svelte';
	import UnauthenticatedView from '$lib/components/general/UnauthenticatedView.svelte';

	let { mode = 'default' }: { mode?: 'default' | 'tv' | 'compact' } = $props();

	const activeRounds = $derived(
		roundService.rounds.filter((r) => r.state === 'started' || r.state === 'scheduled')
	);

	const finalizedRounds = $derived(
		roundService.rounds.filter((r) => r.state === 'finalized' || r.state === 'cancelled')
	);
</script>

{#if !auth.isAuthenticated && appInit.mode !== 'mock'}
	<UnauthenticatedView />
{:else}
	<div class="dashboard" class:tv-mode={mode === 'tv'} class:compact-mode={mode === 'compact'}>
		<header class="dashboard-header">
			<div class="flex items-center gap-2">
				<h1 class="font-display text-xl font-bold text-slate-100">
					{clubService.info?.name ?? 'Frolf Bot'}
				</h1>
			</div>
			<ConnectionStatus />
		</header>

		<div class="dashboard-grid">
			<!-- Rounds Panel -->
			<section class="panel rounds-panel space-y-6">
				<!-- Active Section -->
				<div>
					<h2 class="panel-title sticky top-0 z-10 bg-[var(--guild-surface,#081212)] pb-2">Active & Upcoming</h2>
					{#if roundService.isLoading}
						<LoadingSkeleton variant="card" count={2} />
					{:else if activeRounds.length === 0}
						<div class="py-4 text-center">
							<EmptyState icon="🥏" title="No active rounds" message="Scheduled games appear here" />
						</div>
					{:else}
						<RoundListCompact rounds={activeRounds} />
					{/if}
				</div>

				<!-- History Section -->
				{#if !roundService.isLoading && finalizedRounds.length > 0}
					<div class="border-t border-[var(--guild-border)] pt-4">
						<h2 class="panel-title sticky top-0 z-10 bg-[var(--guild-surface,#081212)] pb-2">Recent History</h2>
						<RoundListCompact rounds={finalizedRounds} limit={5} />
					</div>
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
					                                                                                      entries={leaderboardService.currentView}
					                                                                                      limit={mode === 'tv' ? 20 : 10}
					                                                                                      mode={leaderboardService.viewMode}
					                                                                              />
					                                                                      {/if}
			</section>
		</div>
	</div>
{/if}

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
		font-family: 'Fraunces', serif;
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
