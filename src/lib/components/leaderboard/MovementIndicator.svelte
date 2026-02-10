<script lang="ts">
	import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';

	const { entry, movement }: { entry: LeaderboardEntry; movement: 'up' | 'down' | 'same' } = $props();

	const display = $derived.by(() => {
		if (!entry.previousTagNumber || movement === 'same') {
			return { icon: '—', color: 'text-slate-500', label: 'unchanged', change: 0 };
		}

		const change = Math.abs(entry.previousTagNumber - entry.tagNumber);

		if (movement === 'up') {
			return { icon: '▲', color: 'text-green-500', label: `up ${change}`, change };
		}

		return { icon: '▼', color: 'text-red-500', label: `down ${change}`, change };
	});
</script>

<div class={`flex items-center gap-1 ${display.color}`} aria-label={display.label}>
	<span class="text-xs">{display.icon}</span>
	{#if display.change}
		<span class="text-xs font-medium">{display.change}</span>
	{/if}
</div>
