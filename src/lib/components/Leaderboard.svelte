<script lang="ts">
	import type { LeaderboardData } from '$lib/types/backend';

	export let entries: LeaderboardData = [];
	export let limit: number | undefined = undefined;
	export let showRank: boolean = true;
	export let compact: boolean = false;
	export let testid: string | undefined = undefined;
	export let showViewAll: boolean = false;
	export let onViewAll: (() => void) | undefined = undefined;

	// Transform entries to display format
	$: displayEntries = entries.slice(0, limit || entries.length).map((entry, index) => ({
		rank: showRank ? index + 1 : undefined,
		name: `Player #${entry.tag_number}`, // TODO: Get actual username from user data
		tag: entry.tag_number,
		userId: entry.user_id,
		isCurrentUser: false, // TODO: Check if this is current user
		isTopThree: index < 3
	}));

	function getRankIcon(rank: number) {
		// no emoji icons — keep styling purely typographic and color-based
		return '';
	}

	function getRankGlow(rank: number) {
		switch (rank) {
			case 1:
				// Subtle gold emphasis for #1 — no pulsing animation
				return 'shadow-lg ring-1 ring-accent-300/15';
			case 2:
				return 'shadow-lg shadow-secondary-500/15 ring-1 ring-secondary-500/10';
			case 3:
				return 'shadow-md shadow-primary-500/10 ring-1 ring-primary-500/10';
			default:
				return '';
		}
	}

	function getRankBorder(rank: number) {
		switch (rank) {
			case 1:
				return 'border-accent-400 ring-2 ring-accent-500/20';
			case 2:
				return 'border-secondary-300';
			case 3:
				return 'border-primary-300';
			default:
				return 'border-[var(--guild-border)]';
		}
	}

	function getRankBg(rank: number) {
		switch (rank) {
			case 1:
				return 'bg-gradient-to-r from-accent-50 via-accent-100 to-accent-50 dark:from-accent-900/40 dark:via-accent-800/30 dark:to-accent-900/40'; // Rich gold gradient
			case 2:
				return 'bg-secondary-50/60 dark:bg-secondary-900/25';
			case 3:
				return 'bg-primary-50/60 dark:bg-primary-900/25';
			default:
				return 'bg-guild-surface';
		}
	}

	function getRankScale(rank: number) {
		// Keep same size for all ranks - glowing provides the distinction
		return 'scale-100';
	}
</script>

<div class="space-y-2" data-testid={testid}>
	{#if displayEntries.length === 0}
		<p class="py-4 text-center text-sm text-[var(--guild-text-secondary)]">No players yet.</p>
	{:else}
		{#each displayEntries as player}
			<div
				class="flex items-center justify-between {compact ? 'px-3 py-2' : 'px-4 py-3'} {getRankBg(
					player.rank || 0
				)} rounded-lg border {getRankBorder(player.rank || 0)} {player.isTopThree
					? getRankGlow(player.rank || 0)
					: ''} {player.isCurrentUser
					? 'border-[var(--guild-primary)] bg-[var(--guild-primary)]/10'
					: ''} transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
				data-testid={`leaderboard-row-${player.userId}`}
			>
				<div class="flex items-center">
					{#if showRank && player.rank}
						<div class="mr-3 flex min-w-[1.5rem] items-center">
							<span
								class={compact
									? 'text-sm font-bold text-[var(--guild-text)]'
									: player.rank === 1
										? 'font-secondary text-guild-gold-gradient text-xl font-bold'
										: 'text-lg font-bold text-[var(--guild-text-secondary)]'}
							>
								{player.rank}
							</span>
						</div>
					{/if}
					<div class="flex items-center">
						{#if player.isCurrentUser}
							<div class="mr-2 h-2 w-2 rounded-full bg-[var(--guild-primary)]"></div>
						{/if}
						{#if player.rank === 1}
							<span class="font-secondary text-guild-gold-gradient text-lg font-semibold"
								>{player.name}</span
							>
						{:else}
							<span
								class="text-[var(--guild-text)] {compact
									? 'text-sm'
									: 'font-medium'} {player.isTopThree ? 'font-semibold' : ''}">{player.name}</span
							>
						{/if}
						>
						{#if player.isCurrentUser}
							<span class="ml-2 text-xs font-medium text-[var(--guild-primary)]">(You)</span>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-1">
					{#if !compact && player.isTopThree}
						<!-- Only show tag for top 3 in detailed view -->
						<span class="text-xs text-[var(--guild-text-secondary)]">Tag</span>
						<span
							class="{compact ? 'text-sm' : 'text-lg'} font-bold text-[var(--guild-text-secondary)]"
							>#{player.tag}</span
						>
					{:else if compact}
						<!-- Show tag in compact view -->
						<span class="text-sm font-bold text-[var(--guild-text-secondary)]">#{player.tag}</span>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
	{#if showViewAll && entries.length > 10}
		<div class="mt-4 text-center">
			<button
				class="font-medium text-[var(--guild-primary)] transition-colors hover:text-[var(--guild-primary)]/80"
				on:click={onViewAll}
				data-testid="view-all-button"
			>
				View All ({entries.length} players)
			</button>
		</div>
	{/if}
</div>
