<script lang="ts">
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import LeaderboardRow from './LeaderboardRow.svelte';
	import TagBadge from './TagBadge.svelte';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { guildId: _unusedGuildId }: { guildId?: string } = $props();

	let sortedEntries = $derived(leaderboardService.sortedEntries);
	let topThree = $derived(leaderboardService.sortedEntries.slice(0, 3));

	let lastUpdated = $derived(
		leaderboardService.snapshot?.lastUpdated
			? new Intl.DateTimeFormat('en-US', {
					dateStyle: 'medium',
					timeStyle: 'short'
				}).format(new Date(leaderboardService.snapshot.lastUpdated))
			: null
	);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Tag Leaderboard</h1>
		{#if lastUpdated}
			<span class="text-sm text-slate-400">Last updated: {lastUpdated}</span>
		{/if}
	</div>

	<!-- Top 3 Highlight -->
	{#if topThree.length > 0}
		<div
			class="bg-liquid-skobeloff border-sage-600/20 flex justify-center gap-8 rounded-lg border p-6"
		>
			{#each topThree as entry, index (index)}
				<TagBadge tag={entry} rank={index + 1} size="lg" />
			{/each}
		</div>
	{/if}

	<!-- Full Rankings Table -->
	<div class="bg-liquid-skobeloff border-sage-600/20 rounded-lg border p-4">
		<div class="space-y-2">
			{#each sortedEntries as entry, index (index)}
				<LeaderboardRow {entry} rank={index + 1} />
			{/each}
		</div>
	</div>
</div>
