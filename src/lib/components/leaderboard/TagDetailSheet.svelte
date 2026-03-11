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

	type GroupedTagHistory = {
		id: string; // group id (e.g. roundId or a fallback)
		roundId?: string;
		createdAt: string;
		reason: string;
		got: TagHistoryEntry[];
		gave: TagHistoryEntry[];
	};

	function matchesLastGroup(
		entry: TagHistoryEntry,
		lastGroup: GroupedTagHistory | undefined
	): boolean {
		if (!lastGroup) return false;
		if (entry.roundId && lastGroup.roundId === entry.roundId) return true;
		if (
			!entry.roundId &&
			lastGroup.createdAt === entry.createdAt &&
			lastGroup.reason === entry.reason
		)
			return true;
		return false;
	}

	function addEntryToGroups(
		groups: GroupedTagHistory[],
		entry: TagHistoryEntry,
		currentMemberId: string
	) {
		const direction = getDirection(entry, currentMemberId);
		if (direction === 'involved') return; // Silently drop 'involved' entries (not relevant for "got/gave" transfer flow)

		const lastGroup = groups[groups.length - 1];
		if (matchesLastGroup(entry, lastGroup)) {
			if (direction === 'got') {
				lastGroup.got.push(entry);
			} else {
				lastGroup.gave.push(entry);
			}
		} else {
			groups.push({
				id: entry.roundId ?? entry.id.toString(),
				roundId: entry.roundId,
				createdAt: entry.createdAt,
				reason: entry.reason,
				got: direction === 'got' ? [entry] : [],
				gave: direction === 'gave' ? [entry] : []
			});
		}
	}

	const groupedHistory = $derived.by(() => {
		const groups: GroupedTagHistory[] = [];
		for (const entry of visibleHistory) {
			addEntryToGroups(groups, entry, memberId);
		}
		return groups;
	});

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
		{:else if groupedHistory.length === 0}
			<p class="empty-state">No tag history available.</p>
		{:else}
			{#each groupedHistory as group (group.id)}
				<div class="history-group">
					<svg viewBox="0 0 24 24" class="swap-icon">
						<path
							class="arrow-got {group.got.length ? 'active' : 'inactive'}"
							d="M4 9h16M14 3l6 6"
							stroke-width="2.5"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							class="arrow-gave {group.gave.length ? 'active' : 'inactive'}"
							d="M20 15H4M10 21l-6-6"
							stroke-width="2.5"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>

					<div class="group-content">
						<div class="tags-container">
							{#if group.got.length > 0}
								<div class="tags-row">
									{#each group.got as entry (entry.id)}
										<div class="tag-item got">
											<span class="entry-tag">#{entry.tagNumber}</span>
											{#if entry.oldMemberId && entry.reason !== 'admin_fix'}
												<span class="entry-counterparty"
													>from @{userProfiles.getDisplayName(entry.oldMemberId)}</span
												>
											{/if}
										</div>
									{/each}
								</div>
							{/if}

							{#if group.gave.length > 0}
								<div class="tags-row">
									{#each group.gave as entry (entry.id)}
										<div class="tag-item gave">
											<span class="entry-tag given">#{entry.tagNumber}</span>
											{#if entry.newMemberId && entry.newMemberId !== memberId && entry.reason !== 'admin_fix'}
												<span class="entry-counterparty"
													>to @{userProfiles.getDisplayName(entry.newMemberId)}</span
												>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<div class="entry-meta">
							<span class="entry-reason reason-{group.reason}">{reasonLabel(group.reason)}</span>
							<time class="entry-time" datetime={group.createdAt}
								>{formatDate(group.createdAt)}</time
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

	.history-group {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md, 1rem);
		padding: var(--space-sm, 0.5rem) 0;
		position: relative;
	}

	.swap-icon {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.swap-icon .arrow-got.active {
		stroke: var(--guild-success, #48c774);
	}

	.swap-icon .arrow-gave.active {
		stroke: var(--guild-danger, #ff6b6b);
	}

	.swap-icon .inactive {
		stroke: var(--guild-border, rgba(255, 255, 255, 0.1));
	}

	.group-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs, 0.25rem);
		flex: 1;
		min-width: 0;
	}

	.tags-container {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tags-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tag-item {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm, 0.5rem);
	}

	.entry-tag {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--guild-accent, #b89b5e);
		min-width: 2.5rem;
		flex-shrink: 0;
	}

	.entry-tag.given {
		color: var(--guild-text-secondary);
		text-decoration: line-through;
		font-size: 1rem;
	}

	.entry-counterparty {
		font-size: var(--font-sm, 0.875rem);
		color: var(--guild-text-secondary);
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
