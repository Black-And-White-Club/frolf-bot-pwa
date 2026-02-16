<script lang="ts">
	import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';

	let {
		tag,
		rank,
		size = 'md'
	}: { tag: LeaderboardEntry; rank: number; size?: 'sm' | 'md' | 'lg' } = $props();

	let sizeClasses = $derived(
		size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'md' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm'
	);

	let rankColor = $derived(
		rank === 1
			? 'bg-guild-gold-gradient shadow-lg shadow-guild-accent/30'
			: rank === 2
				? 'bg-gradient-to-br from-slate-300 to-slate-500 shadow-lg shadow-slate-400/30'
				: rank === 3
					? 'bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-700/30'
					: 'bg-slate-700'
	);
</script>

<div class="flex w-28 flex-col items-center gap-2">
	<div
		class={`${sizeClasses} ${rankColor} flex items-center justify-center rounded-full font-bold text-black`}
	>
		{leaderboardService.viewMode === 'points' ? rank : tag.tagNumber}
	</div>
	<span class="w-full truncate text-center text-sm font-medium text-slate-200"
		>{userProfiles.getDisplayName(tag.userId)}</span
	>
	<span class="font-display text-xs font-bold text-guild-accent">{tag.totalPoints} pts</span>
</div>
