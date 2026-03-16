<script lang="ts">
	import type { BettingOverview } from '$lib/stores/activity-betting.svelte';

	let { overview }: { overview: BettingOverview | null } = $props();
	const available = $derived(overview?.wallet?.available ?? 0);
	const reserved = $derived(overview?.wallet?.reserved ?? 0);
</script>

<div class="flex items-center gap-3 border-b border-[--guild-border] px-3 py-2 text-xs">
	<span class="text-[--guild-text-secondary]">Wallet</span>
	<span class="font-semibold text-[--guild-text]">{available} pts available</span>
	{#if reserved > 0}
		<span class="text-[--guild-text-secondary]">{reserved} reserved</span>
	{/if}
</div>
