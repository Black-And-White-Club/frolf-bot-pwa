<script lang="ts">
	import type { TagHistoryEntry } from '$lib/stores/tags.svelte';
	import { Chart, Svg, Area, Spline } from 'layerchart';
	import { scaleTime, scaleLinear } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';

	interface Props {
		history: TagHistoryEntry[];
		memberId: string;
		totalTags?: number;
	}

	let { history, memberId, totalTags }: Props = $props();

	// Negate tagNumber so lower tag (better rank) appears higher on chart.
	// LayerChart/layer-cake maps higher data values to the top of the chart.
	// Exclude 'restore' entries — they're admin/system events, not real swaps.
	const chartData = $derived(
		history
			.filter((e) => e.newMemberId === memberId && e.reason !== 'restore')
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
			.map((e) => ({
				date: new Date(e.createdAt),
				value: -e.tagNumber,
				tag: e.tagNumber
			}))
	);
</script>

<div class="chart-outer">
	{#if chartData.length < 2}
		<p class="empty">Not enough history yet.</p>
	{:else}
		<div class="chart-wrap">
			<Chart
				data={chartData}
				x="date"
				xScale={scaleTime()}
				y="value"
				yScale={scaleLinear()}
				yDomain={totalTags ? [-totalTags, -1] : undefined}
				yNice={false}
				padding={{ top: 24, right: 20, bottom: 8, left: 8 }}
			>
				<Svg>
					<defs>
						<!-- Gold-to-teal area gradient — brand colors -->
						<linearGradient id="lc-tag-grad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="var(--guild-accent, #b89b5e)" stop-opacity="0.45" />
							<stop offset="55%" stop-color="var(--guild-primary, #007474)" stop-opacity="0.1" />
							<stop offset="100%" stop-color="var(--guild-primary, #007474)" stop-opacity="0" />
						</linearGradient>
						<!-- Amethyst aura glow — matches --guild-glow-aura token -->
						<filter id="lc-glow" x="-20%" y="-40%" width="140%" height="180%">
							<feGaussianBlur stdDeviation="3" result="blur" />
							<feFlood
								flood-color="var(--guild-secondary, #8b7bb8)"
								flood-opacity="0.5"
								result="color"
							/>
							<feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					<!-- Area fill with brand gradient -->
					<Area fill="url(#lc-tag-grad)" curve={curveMonotoneX} tweened={{ duration: 600 }} />

					<!-- Data line: gold with amethyst glow, draws on mount -->
					<Spline
						stroke="var(--guild-accent, #b89b5e)"
						strokeWidth={2.5}
						curve={curveMonotoneX}
						filter="url(#lc-glow)"
						draw={{ duration: 1200 }}
					/>
				</Svg>
			</Chart>
		</div>
	{/if}
</div>

<style>
	.chart-outer {
		width: 100%;
	}

	.chart-wrap {
		height: 160px;
		width: 100%;
	}

	.empty {
		text-align: center;
		color: var(--guild-text-muted, rgb(148 163 184));
		padding: 1.5rem 0;
		font-size: 0.875rem;
	}
</style>
