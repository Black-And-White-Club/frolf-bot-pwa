<script lang="ts">
	let { history }: { history: number[] } = $props();

	// Last 10 positions, inverted (lower tag = higher on chart)
	let points = $derived(
		history.slice(-10).map((pos, i) => ({
			x: i * 20,
			y: 50 - pos * 2 // Invert so #1 is at top
		}))
	);

	let pathD = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));
</script>

<svg class="w-48 h-12" viewBox="0 0 180 50">
	<path d={pathD} fill="none" stroke="currentColor" stroke-width="2" class="text-sage-500" />
	{#each points as point}
		<circle cx={point.x} cy={point.y} r="3" class="fill-sage-500" />
	{/each}
</svg>
