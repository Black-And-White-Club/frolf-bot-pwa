<script lang="ts">
	// removed unused onMount - using $effect below
	import { mockAPI, mockUsers } from '$lib/data/mockData';
	import type { DashboardData, User } from '$lib/types/backend';
	import { setGuildTheme } from '$lib/stores/theme';

	// Static imports for critical path
	import Button from '$lib/components/Button.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import RoundsSection from '$lib/components/RoundSection.svelte';

	// Lazy loader components
	import LeaderboardLoader from '$lib/components/LeaderboardLoader.svelte';
	import UserProfileLoader from '$lib/components/UserProfileLoader.svelte';
	import CollapsibleCard from '$lib/components/CollapsibleCard.svelte';

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
	<div
		class="flex items-center justify-center"
		style="min-height: calc(100vh - (var(--app-header-height) + env(safe-area-inset-top)));"
	>
		<div
			class="h-12 w-12 animate-spin rounded-full border-2 border-transparent border-b-current"
			style="border-bottom-color: var(--guild-primary);"
			aria-label="Loading dashboard"
			role="status"
		></div>
	</div>
{:else if error}
	<div class="mx-auto max-w-2xl p-4 sm:p-8">
		<div
			class="rounded-lg border p-4 sm:p-6"
			style="background: var(--guild-error-bg); border-color: var(--guild-error);"
			role="alert"
		>
			<h2 class="mb-2 text-lg font-semibold">Error loading dashboard</h2>
			<p class="text-sm opacity-90">{error}</p>
			<Button variant="primary" size="sm" onclick={loadDashboard} class="mt-4">Retry</Button>
		</div>
	</div>
{:else if dashboardData}
	<div data-testid="page-dashboard">
		<div class="dashboard-container">
			<!-- Quick Stats Grid -->
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

			<!-- Main Content Grid -->
			<div class="content-grid">
				<!-- Rounds Column -->
				<div class="rounds-column">
					{#if scheduledRounds.length > 0}
						<RoundsSection
							title="Scheduled Rounds"
							rounds={scheduledRounds}
							badges={[{ label: `${stats.scheduled} upcoming`, color: 'secondary' }]}
							onRoundClick={handleRoundClick}
							controlWidth="6.25rem"
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
							onRoundClick={handleRoundClick}
							controlWidth="6.25rem"
						/>
					{/if}

					{#if completedRounds.length > 0}
						<RoundsSection
							title="Recent Results"
							rounds={completedRounds.slice(0, 3)}
							badges={[{ label: `${stats.completed} completed`, color: 'accent' }]}
							showDescription={false}
							onRoundClick={handleRoundClick}
							controlWidth="6.25rem"
						/>
					{/if}

					<!-- Mobile Profile -->
					{#if currentUser}
						{#snippet mobile_profile_header()}
							<div class="mb-4 flex items-center justify-between">
								<h2 class="card-title card-title--skobeloff text-xl font-semibold">Your Stats</h2>
								<Button
									variant="secondary"
									size="sm"
									onclick={handleProfileClick}
									testid="btn-view-profile-mobile"
									class="link-like"
								>
									View Profile
								</Button>
							</div>
						{/snippet}

						{#snippet mobile_profile_children()}
							<UserProfileLoader
								user={currentUser!}
								showStats={true}
								testid="userprofile-current-mobile"
							/>
						{/snippet}

						<CollapsibleCard
							class="profile-card profile-card--mobile lg:hidden"
							testid="mobile-profile-card"
							header={mobile_profile_header}
							children={mobile_profile_children}
						/>
					{/if}
				</div>

				<!-- Sidebar -->
				<aside class="sidebar">
					{#snippet leaderboard_header()}
						<div class="mb-4 flex items-center justify-between">
							<h2 class="card-title card-title--skobeloff text-xl font-semibold">Leaderboard</h2>
						</div>
					{/snippet}

					{#snippet leaderboard_children()}
						<LeaderboardLoader
							entries={dashboardData?.leaderboard_preview ?? []}
							limit={10}
							showRank={true}
							compact={true}
							testid="leaderboard-main"
							showViewAll={true}
							minViewAllCount={5}
						/>
					{/snippet}

					<CollapsibleCard
						class="rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md"
						style="background: var(--guild-surface); border-color: var(--guild-border);"
						testid="leaderboard-card"
						header={leaderboard_header}
						children={leaderboard_children}
					/>

					{#if currentUser}
						{#snippet desktop_profile_header()}
							<div class="mb-4 flex items-center justify-between">
								<h2 class="card-title card-title--skobeloff text-xl font-semibold">Your Stats</h2>
								<Button
									variant="secondary"
									size="sm"
									onclick={handleProfileClick}
									testid="btn-view-profile"
									class="link-like"
								>
									View Profile
								</Button>
							</div>
						{/snippet}

						{#snippet desktop_profile_children()}
							<UserProfileLoader
								user={currentUser!}
								showStats={true}
								testid="userprofile-current"
							/>
						{/snippet}

						<CollapsibleCard
							class="hidden rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md lg:block"
							style="background: var(--guild-surface); border-color: var(--guild-border);"
							testid="desktop-profile-card"
							header={desktop_profile_header}
							children={desktop_profile_children}
						/>
					{/if}
				</aside>
			</div>
		</div>
	</div>
{/if}
