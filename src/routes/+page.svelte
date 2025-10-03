<script lang="ts">
	import { onMount } from 'svelte';
	import { mockAPI, mockUsers } from '$lib/data/mockData';
	import type { DashboardData, Round, User } from '$lib/types/backend';
	import Button from '$lib/components/Button.svelte';
	import RoundCard from '$lib/components/round/RoundCard.svelte';
	import ScoreCard from '$lib/components/ScoreCard.svelte';
	import ThemeProvider from '$lib/components/ThemeProvider.svelte';
	// Icons: lazy-load on client to reduce initial bundle
		let ActiveRoundsIcon = $state<any>(null);
		let ScheduledIcon = $state<any>(null);
		let CompletedIcon = $state<any>(null);
		let TotalPlayersIcon = $state<any>(null);
		import { setGuildTheme } from '$lib/stores/theme';

	let dashboardData: DashboardData | null = $state(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedGuild = $state('mock_guild_123'); // TODO: Get from auth context
	let activeRounds = $state<Round[]>([]);
	let scheduledRounds = $state<Round[]>([]);
	let completedRounds = $state<Round[]>([]);
	let currentUser = $state<User | null>(null);

	// Lazy-loaded components (client-only, reduce initial bundle)
	let Leaderboard = $state<any>(null);
	let UserProfile = $state<any>(null);

	onMount(async () => {
		try {
			dashboardData = await mockAPI.getDashboard();
			// Mock current user - in real app this would come from auth
			currentUser = mockUsers[0];

			// Set theme based on guild
			    setGuildTheme(selectedGuild);
			// Dynamically import heavy/right-column components on client
			// so they don't bloat the initial SSR bundle.
			const [lb, up, aIcon, sIcon, cIcon, tIcon] = await Promise.all([
				import('$lib/components/Leaderboard.svelte'),
				import('$lib/components/UserProfile.svelte'),
				import('$lib/components/icons/ActiveRounds.svelte'),
				import('$lib/components/icons/Scheduled.svelte'),
				import('$lib/components/icons/Completed.svelte'),
				import('$lib/components/icons/TotalPlayers.svelte')
			]);
			Leaderboard = lb?.default ?? lb;
			UserProfile = up?.default ?? up;
			ActiveRoundsIcon = aIcon?.default ?? aIcon;
			ScheduledIcon = sIcon?.default ?? sIcon;
			CompletedIcon = cIcon?.default ?? cIcon;
			TotalPlayersIcon = tIcon?.default ?? tIcon;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard';
		} finally {
			loading = false;
		}
	});

	function handleRoundClick(payload: { roundId: string }) {
		// For now, just expand the round details inline
		// TODO: Later could open modal or navigate
	}

	function handleProfileClick() {
		// TODO: Scroll to profile section or open modal
	}

	function handleCreateRound() {
		// TODO: Open create round modal
	}

	function getStatusBgColor(colorVar: string) {
		switch (colorVar) {
			case 'var(--guild-primary)':
				return 'rgba(var(--guild-primary-rgb, 0, 116, 116), 0.1)';
			case 'var(--guild-secondary)':
				return 'rgba(var(--guild-secondary-rgb, 139, 123, 184), 0.1)';
			case 'var(--guild-accent)':
				return 'rgba(var(--guild-accent-rgb, 203, 165, 53), 0.1)';
			default:
				return 'rgba(107, 114, 128, 0.1)';
		}
	}

	// Helper functions for data filtering
	$effect(() => {
		if (dashboardData?.recent_rounds) {
			activeRounds = dashboardData.recent_rounds.filter(r => r.status === 'active');
			scheduledRounds = dashboardData.recent_rounds.filter(r => r.status === 'scheduled');
			completedRounds = dashboardData.recent_rounds.filter(r => r.status === 'completed');
		}
	});
</script>

<svelte:head>
	<title>Frolf Bot - Guild Dashboard</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center min-h-screen">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2" style="border-color: var(--guild-primary);"></div>
	</div>
{:else if error}
			<div class="max-w-2xl mx-auto px-4 py-8">
				<div class="rounded-lg p-4 bg-guild-error border border-guild-error">
					<h2 class="text-guild-error font-semibold">Error loading dashboard</h2>
					<p class="text-guild-error mt-1">{error}</p>
				</div>
			</div>
{:else if dashboardData}
	<ThemeProvider>
	<div class="min-h-screen bg-[var(--guild-background)]" data-testid="page-dashboard">
			<!-- Header -->
			<header class="shadow-sm border-b bg-guild-surface" style="border-color: var(--guild-border);">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div class="flex justify-between items-center">
						<div class="flex items-center space-x-3">
							<h1 class="text-2xl font-bold" style="color: var(--guild-primary);">🥏 Frolf Bot</h1>
							<span class="text-sm" style="color: var(--guild-text-secondary);">Guild Dashboard</span>
						</div>
						<!-- <Button variant="primary" size="sm" onClick={handleCreateRound}>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
							</svg>
							New Round
						</Button> -->
					</div>
				</div>
			</header>

			<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<!-- Quick Stats -->
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<div class="rounded-xl shadow-sm border p-4 bg-guild-surface" data-testid="stat-active" style="border-color: var(--guild-border);">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium" style="color: var(--guild-text-secondary);">Active Rounds</p>
								<p class="text-2xl font-bold" style="color: var(--guild-text);">{activeRounds.length}</p>
							</div>
							<div class="p-2 rounded-lg" style="background-color: {getStatusBgColor('var(--guild-primary)')};">
								{#if ActiveRoundsIcon}
									<ActiveRoundsIcon class="w-5 h-5 text-guild-primary" testid="stat-icon-active-rounds" />
								{:else}
									<svg class="w-5 h-5 text-guild-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 2a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V3a1 1 0 011-1z"></path></svg>
								{/if}
							</div>
						</div>
					</div>

					<div class="rounded-xl shadow-sm border p-4 bg-guild-surface" data-testid="stat-scheduled" style="border-color: var(--guild-border);">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium" style="color: var(--guild-text-secondary);">Scheduled</p>
								<p class="text-2xl font-bold" style="color: var(--guild-text);">{scheduledRounds.length}</p>
							</div>
							<div class="p-2 rounded-lg" style="background-color: {getStatusBgColor('var(--guild-secondary)')};">
								{#if ScheduledIcon}
									<ScheduledIcon class="w-5 h-5 text-guild-secondary" testid="stat-icon-scheduled" />
								{:else}
									<svg class="w-5 h-5 text-guild-secondary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 2a1 1 0 000 2h8a1 1 0 100-2H6zM4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"></path></svg>
								{/if}
							</div>
						</div>
					</div>

					<div class="rounded-xl shadow-sm border p-4 bg-guild-surface" data-testid="stat-completed" style="border-color: var(--guild-border);">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium" style="color: var(--guild-text-secondary);">Completed</p>
								<p class="text-2xl font-bold" style="color: var(--guild-text);">{completedRounds.length}</p>
							</div>
							<div class="p-2 rounded-lg" style="background-color: {getStatusBgColor('var(--guild-accent)')};">
								{#if CompletedIcon}
									<CompletedIcon class="w-5 h-5 text-guild-accent" testid="stat-icon-completed" />
								{:else}
									<svg class="w-5 h-5 text-guild-accent" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M7 10l2 2 4-4"></path></svg>
								{/if}
							</div>
						</div>
					</div>

					<div class="rounded-xl shadow-sm border p-4 bg-guild-surface" data-testid="stat-total-players" style="border-color: var(--guild-border);">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium" style="color: var(--guild-text-secondary);">Total Players</p>
								<p class="text-2xl font-bold" style="color: var(--guild-text);">{dashboardData.leaderboard_preview?.length || 0}</p>
							</div>
							<div class="p-2 rounded-lg" style="background-color: {getStatusBgColor('var(--guild-primary)')};">
								{#if TotalPlayersIcon}
									<TotalPlayersIcon class="w-5 h-5 text-guild-primary" testid="stat-icon-total-players" />
								{:else}
									<svg class="w-5 h-5 text-guild-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 3a3 3 0 100 6 3 3 0 000-6zM4 14a4 4 0 018 0H4z"></path></svg>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Main Content Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<!-- Left Column: Active Rounds -->
					<div class="lg:col-span-2 space-y-6">
						<!-- Active Rounds Section -->
						{#if activeRounds.length > 0}
							<section class="rounded-xl shadow-lg border border-[var(--guild-border)] p-6 hover:shadow-xl transition-all duration-300 bg-guild-surface" style="border-color: var(--guild-border);">
								<div class="flex items-center justify-between mb-4">
									<h2 class="text-xl font-semibold" style="color: var(--guild-text);">Active Rounds</h2>
									<div class="flex items-center space-x-2">
										<span class="px-2 py-1 text-xs font-medium rounded-full text-guild-surface" style="background-color: {getStatusBgColor('var(--guild-primary)')}; border: 1px solid var(--guild-primary);">
											{activeRounds.length} active
										</span>
										<span class="px-2 py-1 text-xs font-medium rounded-full text-guild-surface" style="background-color: {getStatusBgColor('var(--guild-secondary)')}; border: 1px solid var(--guild-secondary);">
											{activeRounds.reduce((total, round) => total + round.participants.length, 0)} playing
										</span>
									</div>
								</div>
								<div class="space-y-4">
									{#each activeRounds as round}
										<RoundCard
											{round}
											onRoundClick={handleRoundClick}
											showStatus={true}
											compact={false}
											dataTestId={`round-card-${round.round_id}`}
										/>
									{/each}
								</div>
							</section>
						{/if}

						<!-- Scheduled Rounds Section -->
						{#if scheduledRounds.length > 0}
							<section class="rounded-xl shadow-lg border border-[var(--guild-border)] p-6 hover:shadow-xl transition-all duration-300 bg-guild-surface" style="border-color: var(--guild-border);">
								<div class="flex items-center justify-between mb-4">
									<h2 class="text-xl font-semibold" style="color: var(--guild-text);">Scheduled Rounds</h2>
									<div class="flex items-center space-x-2">
										<span class="px-2 py-1 text-xs font-medium rounded-full text-guild-surface" style="background-color: {getStatusBgColor('var(--guild-secondary)')}; border: 1px solid var(--guild-secondary);">
											{scheduledRounds.length} upcoming
										</span>
										<span class="px-2 py-1 text-xs font-medium rounded-full text-guild-surface" style="background-color: {getStatusBgColor('var(--guild-accent)')}; border: 1px solid var(--guild-accent);">
											{scheduledRounds.reduce((total, round) => total + round.participants.length, 0)} signed up
										</span>
									</div>
								</div>
								<div class="space-y-4">
									{#each scheduledRounds as round}
										<RoundCard
											{round}
											onRoundClick={handleRoundClick}
											showStatus={true}
											compact={true}
											dataTestId={`round-card-${round.round_id}`}
										/>
									{/each}
								</div>
							</section>
						{/if}

						<!-- Recent Completed Rounds -->
						{#if completedRounds.length > 0}
							<section class="rounded-xl shadow-lg border border-[var(--guild-border)] p-6 hover:shadow-xl transition-all duration-300 bg-guild-surface" style="border-color: var(--guild-border);">
								<div class="flex items-center justify-between mb-4">
									<h2 class="text-xl font-semibold" style="color: var(--guild-text);">Recent Results</h2>
									<div class="flex items-center space-x-2">
										<span class="px-2 py-1 text-xs font-medium rounded-full text-guild-surface" style="background-color: {getStatusBgColor('var(--guild-accent)')}; border: 1px solid var(--guild-accent);">
											{completedRounds.length} completed
										</span>
										<span class="px-2 py-1 text-xs font-medium rounded-full text-guild-surface" style="background-color: {getStatusBgColor('var(--guild-primary)')}; border: 1px solid var(--guild-primary);">
											{completedRounds.reduce((total, round) => total + round.participants.filter(p => p.score !== undefined && p.score !== null).length, 0)} finished
										</span>
									</div>
								</div>
								<div class="space-y-4">
									{#each completedRounds.slice(0, 3) as round}
										<RoundCard
											{round}
											onRoundClick={handleRoundClick}
											showStatus={true}
											compact={true}
											dataTestId={`round-card-${round.round_id}`}
										/>
									{/each}
								</div>
							</section>
						{/if}
					</div>

					<!-- Right Column: Leaderboard & Profile -->
					<div class="space-y-6">
						<!-- Leaderboard Section -->
						<section class="rounded-xl shadow-lg border border-[var(--guild-border)] p-6 hover:shadow-xl transition-all duration-300 bg-guild-surface" style="border-color: var(--guild-border);">
							<div class="flex items-center justify-between mb-4">
								<h2 class="text-xl font-semibold" style="color: var(--guild-text);">Leaderboard</h2>
								<Button variant="secondary" size="sm" testid="btn-view-all">View All</Button>
							</div>
							{#if Leaderboard}
								<Leaderboard
									entries={dashboardData.leaderboard_preview}
									limit={10}
									showRank={true}
									compact={true}
									testid="leaderboard-main"
								/>
							{:else}
								<div class="text-sm text-[var(--guild-text-secondary)]">Loading leaderboard…</div>
							{/if}
						</section>

						<!-- User Profile Section -->
						{#if currentUser}
							<section class="rounded-xl shadow-lg border border-[var(--guild-border)] p-6 hover:shadow-xl transition-all duration-300 bg-guild-surface" style="border-color: var(--guild-border);">
								<div class="flex items-center justify-between mb-4">
									<h2 class="text-xl font-semibold" style="color: var(--guild-text);">Your Stats</h2>
									<Button variant="secondary" size="sm" onClick={handleProfileClick} testid="btn-view-profile">View Profile</Button>
								</div>
								{#if UserProfile}
									<UserProfile
										user={currentUser}
										showStats={true}
										testid="userprofile-current"
									/>
								{:else}
									<div class="text-sm text-[var(--guild-text-secondary)]">Loading profile…</div>
								{/if}
							</section>
						{/if}
					</div>
				</div>
			</main>
		</div>
	</ThemeProvider>
{/if}
