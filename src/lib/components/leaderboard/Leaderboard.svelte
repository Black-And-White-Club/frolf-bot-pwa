<script lang="ts">
	import type { LeaderboardData } from '$lib/types/backend';
	import PlayerRow from './PlayerRow.svelte';
	import ChevronCollapse from '$lib/components/general/ChevronCollapse.svelte';

	type Props = {
		entries?: LeaderboardData;
		showRank?: boolean;
		compact?: boolean;
		testid?: string;
		onViewAll?: () => void;
	};

	let { entries = [], showRank = true, compact = false, testid, onViewAll }: Props = $props();

	let collapsed = $state(false);

	// (no debug logging)

	const MOBILE_LIMIT = 5;
	const DESKTOP_LIMIT = 10;

	let isMobile = $state(false);

	$effect(() => {
		const mediaQuery = window.matchMedia('(max-width: 768px)');
		isMobile = mediaQuery.matches;

		const handler = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
		};

		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	});

	const displayEntries = $derived.by(() => {
		const limit = isMobile ? MOBILE_LIMIT : DESKTOP_LIMIT;
		return (collapsed ? [] : entries.slice(0, limit)).map((entry, index) => ({
			rank: showRank ? index + 1 : undefined,
			name: `Player #${entry.tag_number}`,
			tag: entry.tag_number,
			userId: entry.user_id,
			isCurrentUser: false,
			isTopThree: index < 3
		}));
	});

	const showViewAllButton = $derived.by(
		() => entries.length > (isMobile ? MOBILE_LIMIT : DESKTOP_LIMIT) && !!onViewAll && !collapsed
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
		<h3 class="leaderboard-title">Leaderboard</h3>

		<div class="header-controls">
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

	.leaderboard-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--guild-text);
		margin: 0;
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
