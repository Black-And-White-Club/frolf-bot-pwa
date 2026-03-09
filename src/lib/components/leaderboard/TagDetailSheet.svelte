<script lang="ts">
	import { tagStore, type TagHistoryEntry } from '$lib/stores/tags.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { slide } from 'svelte/transition';

	interface Props {
		memberId: string;
	}

	let { memberId }: Props = $props();

	const memberHistory = $derived(tagStore.selectedMemberHistory);

	function getDirection(entry: TagHistoryEntry, viewingId: string): 'got' | 'gave' | 'involved' {
		if (entry.newMemberId === viewingId) return 'got';
		if (entry.oldMemberId === viewingId) return 'gave';
		return 'involved';
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getCounterparty(entry: TagHistoryEntry, viewingId: string): string | null {
		if (entry.reason === 'admin_fix') return null;
		const direction = getDirection(entry, viewingId);
		if (direction === 'got' && entry.oldMemberId) {
			return 'from @' + userProfiles.getDisplayName(entry.oldMemberId);
		}
		if (direction === 'gave' && entry.newMemberId && entry.newMemberId !== viewingId) {
			return 'to @' + userProfiles.getDisplayName(entry.newMemberId);
		}
		return null;
	}

	function reasonLabel(reason: string): string {
		if (reason === 'admin_fix') return 'admin fix';
		if (reason === 'round_swap') return 'round swap';
		return reason;
	}

	// Sparkline SVG constants
	const SPARK_VW = 300;
	const SPARK_VH = 60;
	const SPARK_PAD = 10;
	const SPARK_W = SPARK_VW - SPARK_PAD * 2;
	const SPARK_H = SPARK_VH - SPARK_PAD * 2;

	const sparkData = $derived.by(() => {
		if (memberHistory.length < 2) return null;

		const sorted = [...memberHistory].sort(
			(a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
		);

		const tags = sorted.map((e) => e.tagNumber);
		const times = sorted.map((e) => Date.parse(e.createdAt));

		const minTag = Math.min(...tags);
		const maxTag = Math.max(...tags);
		const minTime = times[0];
		const maxTime = times[times.length - 1];
		const tagRange = maxTag - minTag || 1;
		const timeRange = maxTime - minTime || 1;

		const points = sorted.map((entry, i) => ({
			x: SPARK_PAD + ((times[i] - minTime) / timeRange) * SPARK_W,
			// Inverted: lower tag number = higher on chart
			y: SPARK_PAD + ((maxTag - tags[i]) / tagRange) * SPARK_H,
			tag: tags[i]
		}));

		return {
			points,
			polyline: points.map((p) => `${p.x},${p.y}`).join(' ')
		};
	});
</script>

<div class="tag-detail-inline" transition:slide={{ duration: 200 }}>
	{#if sparkData}
		<div class="sparkline-wrapper">
			<svg viewBox="0 0 {SPARK_VW} {SPARK_VH}" class="sparkline" aria-hidden="true">
				<polyline
					points={sparkData.polyline}
					fill="none"
					stroke="var(--guild-accent, #b89b5e)"
					stroke-width="2"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
				{#each sparkData.points as point, i (i)}
					<circle cx={point.x} cy={point.y} r="4" fill="var(--guild-accent, #b89b5e)" />
					{#if i === 0 || i === sparkData.points.length - 1}
						<text
							x={point.x}
							y={point.y <= SPARK_PAD + 12 ? point.y + 16 : point.y - 8}
							text-anchor={i === 0 ? 'start' : 'end'}
							class="spark-label"
						>#{point.tag}</text>
					{/if}
				{/each}
			</svg>
		</div>
	{/if}

	<div class="history-list">
		{#if tagStore.historyLoading}
			<p class="empty-state">Loading history...</p>
		{:else if memberHistory.length === 0}
			<p class="empty-state">No tag history available.</p>
		{:else}
			{#each memberHistory as entry (entry.id)}
				{@const direction = getDirection(entry, memberId)}
				{@const counterparty = getCounterparty(entry, memberId)}
				<div class="history-entry">
					<span class="direction-badge direction-{direction}">
						{#if direction === 'got'}GOT{:else if direction === 'gave'}GAVE{:else}~{/if}
					</span>
					<div class="entry-tag">#{entry.tagNumber}</div>
					<div class="entry-details">
						{#if counterparty}
							<span class="entry-counterparty">{counterparty}</span>
						{/if}
						<div class="entry-meta">
							<span class="entry-reason reason-{entry.reason}">{reasonLabel(entry.reason)}</span>
							<time class="entry-time" datetime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.tag-detail-inline {
		display: flex;
		flex-direction: column;
		background: var(--guild-surface-elevated, rgba(255, 255, 255, 0.05));
		border: 1px solid var(--guild-border);
		border-top: none;
		border-bottom-left-radius: var(--radius-md, 0.5rem);
		border-bottom-right-radius: var(--radius-md, 0.5rem);
		position: relative;
		z-index: 0;
	}

	.sparkline-wrapper {
		padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
		border-bottom: 1px solid var(--guild-border);
	}

	.sparkline {
		width: 100%;
		height: auto;
		display: block;
	}

	.spark-label {
		font-size: 9px;
		fill: var(--guild-text-secondary);
		font-family: inherit;
	}

	.history-list {
		overflow-y: auto;
		max-height: 24rem;
		padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 0.5rem);
	}

	.empty-state {
		text-align: center;
		color: var(--guild-text-secondary);
		padding: var(--space-lg, 1.5rem) 0;
	}

	.history-entry {
		display: flex;
		align-items: center;
		gap: var(--space-sm, 0.5rem);
		padding: var(--space-xs, 0.25rem) 0;
	}

	.direction-badge {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 2px 6px;
		border-radius: 4px;
		min-width: 2.75rem;
		text-align: center;
		flex-shrink: 0;
	}

	.direction-got {
		background: rgba(72, 199, 116, 0.15);
		color: #48c774;
	}

	.direction-gave {
		background: rgba(255, 107, 107, 0.15);
		color: #ff6b6b;
	}

	.direction-involved {
		background: rgba(255, 255, 255, 0.08);
		color: var(--guild-text-secondary);
	}

	.entry-tag {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--guild-accent, #b89b5e);
		min-width: 2.5rem;
		flex-shrink: 0;
	}

	.entry-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.entry-counterparty {
		font-size: var(--font-sm, 0.875rem);
		color: var(--guild-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.entry-meta {
		display: flex;
		align-items: center;
		gap: var(--space-sm, 0.5rem);
	}

	.entry-reason {
		font-size: var(--font-xs, 0.75rem);
		padding: 1px 6px;
		border-radius: 3px;
		font-weight: 500;
	}

	.reason-admin_fix {
		background: rgba(255, 255, 255, 0.08);
		color: var(--guild-text-secondary);
	}

	.reason-round_swap {
		background: rgba(184, 155, 94, 0.2);
		color: var(--guild-accent, #b89b5e);
	}

	.entry-time {
		font-size: var(--font-xs, 0.75rem);
		color: var(--guild-text-secondary);
	}
</style>
