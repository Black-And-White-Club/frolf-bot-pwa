<script lang="ts">
	import type { TagHistoryEntry } from '$lib/stores/tags.svelte';

	interface Props {
		history: TagHistoryEntry[];
		memberId: string;
	}

	let { history, memberId }: Props = $props();

	// Filter and sort entries for this member
	const memberEntries = $derived(
		history
			.filter((e) => e.newMemberId === memberId)
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
	);

	// Build chart data points
	const chartPoints = $derived(
		memberEntries.map((e, i) => ({
			x: i,
			y: e.tagNumber,
			label: new Date(e.createdAt).toLocaleDateString()
		}))
	);

	// SVG dimensions
	const width = 600;
	const height = 200;
	const padding = { top: 20, right: 20, bottom: 30, left: 40 };

	const innerWidth = width - padding.left - padding.right;
	const innerHeight = height - padding.top - padding.bottom;

	const chartBounds = $derived.by(() => {
		if (chartPoints.length === 0) {
			return { minTag: 0, range: 1 };
		}

		let minTag = chartPoints[0].y;
		let maxTag = chartPoints[0].y;
		for (const point of chartPoints) {
			if (point.y < minTag) minTag = point.y;
			if (point.y > maxTag) maxTag = point.y;
		}
		return { minTag, range: maxTag - minTag || 1 };
	});

	// Scale functions
	function scaleX(i: number): number {
		if (chartPoints.length <= 1) return padding.left + innerWidth / 2;
		return padding.left + (i / (chartPoints.length - 1)) * innerWidth;
	}

	function scaleY(tag: number): number {
		if (chartPoints.length === 0) return padding.top + innerHeight / 2;
		// Invert: lower tag = higher on chart (better)
		return padding.top + ((tag - chartBounds.minTag) / chartBounds.range) * innerHeight;
	}

	// Build SVG path
	const pathD = $derived(
		chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ')
	);
</script>

<div class="tag-history-chart">
	{#if chartPoints.length < 2}
		<p class="chart-empty">Not enough data to display a chart.</p>
	{:else}
		<svg viewBox="0 0 {width} {height}" class="chart-svg">
			<!-- Grid lines -->
			{#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
				<line
					x1={padding.left}
					y1={padding.top + (i / 4) * innerHeight}
					x2={padding.left + innerWidth}
					y2={padding.top + (i / 4) * innerHeight}
					stroke="var(--color-border, rgba(148, 163, 184, 0.1))"
					stroke-width="1"
				/>
			{/each}

			<!-- Data line -->
			<path d={pathD} fill="none" stroke="var(--color-gold-accent, #c5a04e)" stroke-width="2" />

			<!-- Data points -->
			{#each chartPoints as point (point.x)}
				<circle
					cx={scaleX(point.x)}
					cy={scaleY(point.y)}
					r="3"
					fill="var(--color-gold-accent, #c5a04e)"
				/>
			{/each}
		</svg>
	{/if}
</div>

<style>
	.tag-history-chart {
		width: 100%;
		padding: var(--space-md, 1rem);
	}

	.chart-svg {
		width: 100%;
		height: auto;
	}

	.chart-empty {
		text-align: center;
		color: var(--color-text-muted, #94a3b8);
		padding: var(--space-lg, 1.5rem) 0;
		font-size: var(--font-sm, 0.875rem);
	}
</style>
