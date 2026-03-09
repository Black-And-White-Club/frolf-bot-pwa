<script lang="ts">
	import { tagStore, type TagHistoryEntry } from '$lib/stores/tags.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { slide } from 'svelte/transition';

	// Lazy-load the chart so layerchart/d3 don't land in the SSR bundle or
	// the initial client chunk — the sheet is only opened on interaction.
	let TagHistoryChart = $state<any>(null);
	$effect(() => {
		import('./TagHistoryChart.svelte').then((m) => (TagHistoryChart = m.default));
	});

	interface Props {
		memberId: string;
	}

	let { memberId }: Props = $props();

	const memberHistory = $derived(tagStore.selectedMemberHistory);
	const visibleHistory = $derived(memberHistory.filter((e) => e.reason !== 'restore'));

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
</script>

<div class="tag-detail-inline" transition:slide={{ duration: 200 }}>
	{#if TagHistoryChart}
		<div class="chart-wrapper">
			<TagHistoryChart
				history={memberHistory}
				{memberId}
				totalTags={leaderboardService.entries.length > 0
					? Math.max(...leaderboardService.entries.map((e) => e.tagNumber))
					: (tagStore.maxTagNumber ?? undefined)}
			/>
		</div>
	{/if}

	<div class="history-list">
		{#if tagStore.historyLoading}
			<p class="empty-state">Loading history...</p>
		{:else if visibleHistory.length === 0}
			<p class="empty-state">No tag history available.</p>
		{:else}
			{#each visibleHistory as entry (entry.id)}
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
							<time class="entry-time" datetime={entry.createdAt}
								>{formatDate(entry.createdAt)}</time
							>
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

	.chart-wrapper {
		padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
		border-bottom: 1px solid var(--guild-border);
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
