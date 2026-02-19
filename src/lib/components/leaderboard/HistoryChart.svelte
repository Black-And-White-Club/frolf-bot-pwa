<script lang="ts">
	import { tagStore } from '$lib/stores/tags.svelte';

	interface Props {
		memberId: string;
		guildId: string;
		limit?: number;
	}

	let { memberId, guildId, limit = 20 }: Props = $props();

	// Fetch history whenever memberId or guildId changes.
	$effect(() => {
		if (memberId && guildId) {
			tagStore.fetchTagHistory(guildId, memberId, limit);
		}
	});

	// Tag numbers for this member, oldest-first, capped to last 10
	let tagNumbers = $derived(
		tagStore.history
			.filter((e) => e.newMemberId === memberId)
			.slice(-10)
			.map((e) => e.tagNumber)
	);

	// Build SVG points — lower tag number = higher on chart
	let points = $derived(
		tagNumbers.map((tag, i) => ({
			x: i * 20,
			y: 50 - tag * 2
		}))
	);

	let pathD = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));
</script>

{#if points.length > 0}
	<svg class="h-12 w-48" viewBox="0 0 180 50">
		<path d={pathD} fill="none" stroke="currentColor" stroke-width="2" class="text-sage-500" />
		{#each points as point, i (i)}
			<circle cx={point.x} cy={point.y} r="3" class="fill-sage-500" />
		{/each}
	</svg>
{/if}
