<script lang="ts">
	import type { LeaderboardData } from '$lib/types/backend';

	export let entries: LeaderboardData = [];
	export let limit: number | undefined = undefined;
	export let showRank: boolean = true;
	export let compact: boolean = false;
	export let testid: string | undefined = undefined;

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
		// Remove medal icons - just return empty string
		return '';
	}

	function getRankGlow(rank: number) {
		// Remove glowing effects
		return '';
	}

	function getRankBorder(rank: number) {
		switch (rank) {
			case 1:
				return 'border-[var(--guild-primary)]';
			case 2:
				return 'border-[var(--guild-secondary)]';
			case 3:
				return 'border-[var(--guild-accent)]';
			default:
				return 'border-[var(--guild-border)]';
		}
	}

	function getRankBg(rank: number) {
		switch (rank) {
			case 1:
				return 'bg-[var(--guild-primary)]/5';
			case 2:
				return 'bg-[var(--guild-secondary)]/5';
			case 3:
				return 'bg-[var(--guild-accent)]/5';
			default:
				return 'bg-guild-surface';
		}
	}
</script>

<div class="space-y-2" data-testid={testid}>
	{#if displayEntries.length === 0}
		<p class="text-[var(--guild-text-secondary)] text-center py-4 text-sm">No players yet.</p>
	{:else}
		{#each displayEntries as player}
			<div
				class="flex justify-between items-center {compact ? 'py-2 px-3' : 'py-3 px-4'} {getRankBg(player.rank || 0)} rounded-lg border {getRankBorder(player.rank || 0)} {player.isTopThree ? getRankGlow(player.rank || 0) : ''} {player.isCurrentUser ? 'border-[var(--guild-primary)] bg-[var(--guild-primary)]/10' : ''} transition-all duration-300"
				data-testid={`leaderboard-row-${player.userId}`}
			>
				<div class="flex items-center">
					{#if showRank && player.rank}
						<span class="{compact ? 'text-sm' : 'text-lg'} font-bold mr-3 min-w-[1.5rem] flex items-center text-[var(--guild-text-secondary)]">
							{player.rank}
						</span>
					{/if}
					<div class="flex items-center">
						{#if player.isCurrentUser}
							<div class="w-2 h-2 bg-[var(--guild-primary)] rounded-full mr-2"></div>
						{/if}
						<span class="text-[var(--guild-text)] {compact ? 'text-sm' : 'font-medium'} {player.isTopThree ? 'font-semibold' : ''}">{player.name}</span>
						{#if player.isCurrentUser}
							<span class="ml-2 text-xs text-[var(--guild-primary)] font-medium">(You)</span>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-1">
					{#if !compact && player.isTopThree}
						<!-- Only show tag for top 3 in detailed view -->
						<span class="text-xs text-[var(--guild-text-secondary)]">Tag</span>
						<span class="{compact ? 'text-sm' : 'text-lg'} font-bold text-[var(--guild-text-secondary)]">#{player.tag}</span>
					{:else if compact}
						<!-- Show tag in compact view -->
						<span class="text-sm font-bold text-[var(--guild-text-secondary)]">#{player.tag}</span>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>
