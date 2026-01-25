<script lang="ts">
	import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import MovementIndicator from './MovementIndicator.svelte';

	let { entry, rank }: { entry: LeaderboardEntry; rank: number } = $props();

	let tagStyle = $derived(
		rank <= 3
			? 'bg-amber-500 text-black font-bold'
			: rank <= 10
				? 'bg-sage-600 text-white'
				: 'bg-slate-700 text-slate-200'
	);

	let movement = $derived(leaderboardService.getMovementIndicator(entry));
</script>

<div
	class="flex items-center gap-4 p-3 hover:bg-forest-800/50 rounded-lg transition-colors"
>
	<!-- Tag Number Badge -->
	<div class={`w-10 h-10 rounded-full flex items-center justify-center ${tagStyle}`}>
		{entry.tagNumber}
	</div>

	<!-- Player Info -->
	<div class="flex-1 flex items-center gap-3">
		<span class="font-medium">{entry.displayName ?? `User ${entry.userId}`}</span>
	</div>

	<!-- Movement Indicator -->
	<MovementIndicator {entry} {movement} />
</div>
