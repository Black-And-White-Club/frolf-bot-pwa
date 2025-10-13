<script lang="ts">
	// removed unused onMount - using $effect below
	import { mockAPI, mockUsers } from '$lib/data/mockData';
	import type { DashboardData, User } from '$lib/types/backend';
	import { setGuildTheme } from '$lib/stores/theme';

	// Static imports for critical path
	import Button from '$lib/components/general/Button.svelte';
	import StatCard from '$lib/components/general/StatCard.svelte';
	import RoundsSection from '$lib/components/round/RoundSection.svelte';
	import Leaderboard from '$lib/components/leaderboard/Leaderboard.svelte';
	import UserProfileCard from '$lib/components/user/UserProfileCard.svelte';
	import RoundCard from '$lib/components/round/RoundCard.svelte';

	// State management - use $state.raw for complex objects to avoid deep reactivity overhead
	let dashboardData = $state.raw<DashboardData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedGuild = $state('mock_guild_123');
	let currentUser = $state.raw<User | null>(null);

	// Derived state - memoized with $derived.by for complex calculations
	const activeRounds = $derived.by(
		() => dashboardData?.recent_rounds.filter((r) => r.status === 'active') ?? []
	);

	const scheduledRounds = $derived.by(
		() => dashboardData?.recent_rounds.filter((r) => r.status === 'scheduled') ?? []
	);

	const completedRounds = $derived.by(
		() => dashboardData?.recent_rounds.filter((r) => r.status === 'completed') ?? []
	);

	// Stats computed from derived state
	const stats = $derived.by(() => ({
		active: activeRounds.length,
		scheduled: scheduledRounds.length,
		completed: completedRounds.length,
		totalPlayers: dashboardData?.leaderboard_preview?.length ?? 0,
		scheduledSignups: scheduledRounds.reduce((sum, r) => sum + r.participants.length, 0),
		activePlaying: activeRounds.reduce((sum, r) => sum + r.participants.length, 0),
		completedFinished: completedRounds.reduce(
			(sum, r) => sum + r.participants.filter((p) => p.score != null).length,
			0
		)
	}));

	// Use $effect instead of onMount for better reactivity
	$effect(() => {
		loadDashboard();
	});

	async function loadDashboard() {
		loading = true;
		error = null;

		try {
			const [data, user] = await Promise.all([
				mockAPI.getDashboard(),
				Promise.resolve(mockUsers[0])
			]);

			dashboardData = data;
			currentUser = user;
			setGuildTheme(selectedGuild);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard';
		} finally {
			loading = false;
		}
	}

	// Event handlers - use const for better tree-shaking
	const handleRoundClick = (payload: { roundId: string }) => {
		// Navigate or expand inline
		console.log('Round clicked:', payload.roundId);
	};

	const handleProfileClick = () => {
		// Navigate to profile
		console.log('Profile clicked');
	};
</script>

<svelte:head>
	<title>Frolf Bot - Guild Dashboard</title>
	<meta name="description" content="Guild dashboard for Frolf Bot" />
	<meta name="theme-color" content="#1a1a1a" />
</svelte:head>

{#if loading}
	<div class="loading-container">
		<div class="spinner" role="status" aria-label="Loading dashboard"></div>
	</div>
{:else if error}
	<div class="error-container">
		<div class="error-card" role="alert">
			<h2 class="error-title">Error loading dashboard</h2>
			<p class="error-message">{error}</p>
			<Button variant="primary" size="sm" onclick={loadDashboard} class="mt-4">Retry</Button>
		</div>
	</div>
{:else if dashboardData}
	<div class="dashboard-page" data-testid="page-dashboard">
		<!-- Stats Grid -->
		<div class="stats-grid">
			<StatCard
				label="Active Rounds"
				value={stats.active}
				icon="active"
				color="primary"
				testid="stat-active"
			/>
			<StatCard
				label="Scheduled"
				value={stats.scheduled}
				icon="scheduled"
				color="secondary"
				testid="stat-scheduled"
			/>
			<StatCard
				label="Completed"
				value={stats.completed}
				icon="completed"
				color="accent"
				testid="stat-completed"
			/>
			<StatCard
				label="Total Players"
				value={stats.totalPlayers}
				icon="players"
				color="primary"
				testid="stat-total-players"
			/>
		</div>

		<!-- Main Content Grid with Sidebar -->
		<div class="content-grid">
			<!-- Rounds Column (main content) -->
			<div class="rounds-column">
				{#if scheduledRounds.length > 0}
					<RoundsSection
						title="Scheduled Rounds"
						rounds={scheduledRounds}
						badges={[{ label: `${stats.scheduled} upcoming`, color: 'secondary' }]}
					/>
				{/if}

				{#if activeRounds.length > 0}
					<RoundsSection
						title="Active Rounds"
						rounds={activeRounds}
						badges={[
							{ label: `${stats.active} active`, color: 'primary' },
							{ label: `${stats.activePlaying} playing`, color: 'secondary' }
						]}
					/>
				{/if}

				{#if completedRounds.length > 0}
					<RoundsSection
						title="Recent Results"
						rounds={completedRounds.slice(0, 3)}
						badges={[{ label: `${stats.completed} completed`, color: 'accent' }]}
						showDescription={false}
					/>
				{/if}
			</div>

			<!-- Sidebar (desktop: right column) -->
			<aside class="sidebar">
				<!-- Leaderboard (shows in sidebar on desktop, moves above rounds on mobile) -->
				<div class="leaderboard-card" data-testid="leaderboard-card">
					<Leaderboard
						entries={dashboardData?.leaderboard_preview ?? []}
						showRank={true}
						compact={true}
						testid="leaderboard-main"
						onViewAll={() => console.log('Navigate to full leaderboard')}
					/>
				</div>

				<!-- User Profile Card (desktop only) -->
				{#if currentUser}
					<div class="profile-card" data-testid="desktop-profile-card">
						<UserProfileCard
							user={currentUser}
							showStats={true}
							headerAction={{
								label: 'View Profile',
								onClick: handleProfileClick,
								testid: 'btn-view-profile'
							}}
							testid="userprofilecard-current"
						/>
					</div>
				{/if}
			</aside>
		</div>
	</div>
{/if}

<style>
	/* Loading State */
	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - (var(--app-header-height, 4rem) + env(safe-area-inset-top)));
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 2px solid transparent;
		border-bottom-color: var(--guild-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Error State */
	.error-container {
		max-width: 42rem;
		margin: 0 auto;
		padding: 1rem;
	}

	.error-card {
		background: var(--guild-error-bg);
		border: 1px solid var(--guild-error);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.error-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.error-message {
		font-size: 0.875rem;
		opacity: 0.9;
	}

	/* Dashboard Layout */
	.dashboard-page {
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		gap: 1rem;
	}

	/* Content Grid with Sidebar */
	.content-grid {
		display: grid;
		gap: 1.5rem;
	}

	/* Mobile: Fix grid areas order */
	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
			grid-template-areas:
				'sidebar' /* Leaderboard + Profile together */
				'rounds';
		}

		/* Sidebar contains both cards on mobile */
		.sidebar {
			grid-area: sidebar;
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}

		.rounds-column {
			grid-area: rounds;
		}

		/* Remove individual grid areas on mobile - let sidebar handle order */
		.leaderboard-card,
		.profile-card {
			grid-area: unset;
		}
	}

	/* Desktop: Fix sidebar width */
	@media (min-width: 769px) {
		.content-grid {
			grid-template-columns: 1fr 380px; /* Increased from 320px */
			gap: 1.5rem;
		}

		.sidebar {
			display: flex;
			flex-direction: column;
			gap: 1.5rem;
		}

		.stats-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	/* Large screens: even wider sidebar */
	@media (min-width: 1200px) {
		.content-grid {
			grid-template-columns: 1fr 420px; /* Increased from 360px */
		}
	}

	/* Mobile: Fix order - Leaderboard, then Rounds, then Profile */
	@media (max-width: 768px) {
		.content-grid {
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
		}

		/* Order via flex order property */
		.rounds-column {
			order: 2;
		}

		.sidebar {
			display: contents; /* Break apart sidebar */
		}

		.leaderboard-card {
			order: 1;
		}

		.profile-card {
			order: 3;
		}
	}
</style>
