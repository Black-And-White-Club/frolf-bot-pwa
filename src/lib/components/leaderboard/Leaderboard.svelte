<script lang="ts">
	import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
	import PlayerRow from './PlayerRow.svelte';
	import ChevronCollapse from '$lib/components/general/ChevronCollapse.svelte';
	import ViewToggle from './ViewToggle.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';

	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { isMobile } from '$lib/stores/theme';

	const MOBILE_LIMIT = 5;
	const DESKTOP_LIMIT = 10;

	type ViewMode = 'tags' | 'points';

	type Props = {
		entries?: LeaderboardEntry[];
		showRank?: boolean;
		compact?: boolean;
		mode?: ViewMode;
		testid?: string;
		onViewAll?: () => void;
		title?: string;
		limit?: number;
	};

	let {
		entries = [],
		showRank = true,
		compact = false,
		mode,
		testid,
		onViewAll,
		title = 'Leaderboard',
		limit
	}: Props = $props();

	let collapsed = $state(false);

	// Fallback to service mode if not provided as a prop
	const currentMode = $derived(mode ?? leaderboardService.viewMode);

	const displayEntries = $derived.by(() => {
		const defaultLimit = $isMobile ? MOBILE_LIMIT : DESKTOP_LIMIT;
		const finalLimit = limit ?? defaultLimit;
		return (collapsed ? [] : entries.slice(0, finalLimit)).map((entry, index) => {
			const displayName = userProfiles.getDisplayName(entry.userId);
			return {
				rank: showRank ? index + 1 : undefined,
				name: displayName ?? entry.displayName ?? `Player #${entry.tagNumber}`,
				tag: entry.tagNumber,
				userId: entry.userId,
				avatarUrl: userProfiles.getAvatarUrl(entry.userId),
				totalPoints: entry.totalPoints,
				roundsPlayed: entry.roundsPlayed,
				isCurrentUser: auth.user?.id === entry.userId,
				isTopThree: index < 3
			};
		});
	});

	const showViewAllButton = $derived.by(
		() =>
			entries.length > (limit ?? ($isMobile ? MOBILE_LIMIT : DESKTOP_LIMIT)) &&
			!!onViewAll &&
			!collapsed
	);

	function handleViewAllClick() {
		onViewAll?.();
	}

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class="leaderboard-container" data-testid={testid}>
	<div class="leaderboard-header">
		<div class="title-group">
			<h3 class="leaderboard-title">{title}</h3>
			<span class="entry-count">{entries.length} members</span>
		</div>

		<div class="header-controls">
			<ViewToggle mode={currentMode} onchange={(m) => leaderboardService.setViewMode(m)} />
			{#if showViewAllButton}
				<button type="button" class="view-all-btn" onclick={handleViewAllClick}>
					View all <span class="count">({entries.length})</span>
				</button>
			{/if}

			<ChevronCollapse
				{collapsed}
				disabled={false}
				ariaControls="leaderboard-list"
				ariaLabel={collapsed ? 'Expand leaderboard' : 'Collapse leaderboard'}
				testid={testid ? `${testid}-chevron` : undefined}
				onclick={toggleCollapse}
			/>
		</div>
	</div>

	{#if !collapsed}
		<div class="leaderboard-list" id="leaderboard-list">
			{#if displayEntries.length === 0}
				<p class="empty-state">No players yet.</p>
			{:else}
				{#each displayEntries as player (player.userId)}
					<PlayerRow
						userId={player.userId}
						name={player.name}
						rank={player.rank}
						avatarUrl={player.avatarUrl}
						totalPoints={player.totalPoints}
						roundsPlayed={player.roundsPlayed}
						isCurrentUser={player.isCurrentUser}
						{compact}
						{showRank}
						testid={`leaderboard-row-${player.userId}`}
					/>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.leaderboard-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		/* Card styling so the leaderboard appears like other cards */
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-radius: 0.75rem;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

		/* no debug outline */
	}

	.leaderboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.title-group {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.leaderboard-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--guild-text);
		margin: 0;
	}

	.entry-count {
		font-size: 0.875rem;
		color: var(--guild-text-muted);
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.view-all-btn {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--guild-primary);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		white-space: nowrap;
	}

	.view-all-btn:hover {
		text-decoration: underline;
	}

	.count {
		opacity: 0.7;
	}

	.leaderboard-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		font-size: 0.875rem;
		color: var(--guild-text-secondary);
	}

	/* Mobile: Hide count, stack header if needed */
	@media (max-width: 768px) {
		.count {
			display: none;
		}
	}
</style>
