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
					<!-- GOT ROW -->
					{#if group.got.length > 0}
						<div class="icon-cell">
							<svg viewBox="0 0 24 16" class="swap-icon">
								<path
									class="arrow-got active"
									d="M20 10H4M10 4l-6 6"
									stroke-width="2.5"
									fill="none"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<div class="content-cell">
							<div class="tags-row">
								{#each group.got as entry (entry.id)}
									<div class="tag-item got">
										<span class="entry-tag">#{entry.tagNumber}</span>
										{#if entry.oldMemberId && entry.reason !== 'admin_fix'}
											<span class="entry-counterparty"
												>from <span class="counterparty-name"
													>@{userProfiles.getDisplayName(entry.oldMemberId)}</span
												></span
											>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{:else if group.gave.length > 0}
						<div class="icon-cell">
							<svg viewBox="0 0 24 16" class="swap-icon">
								<path
									class="arrow-got inactive"
									d="M20 10H4M10 4l-6 6"
									stroke-width="2.5"
									fill="none"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<div class="content-cell"></div>
					{/if}

					<!-- GAVE ROW -->
					{#if group.gave.length > 0}
						<div class="icon-cell">
							<svg viewBox="0 0 24 16" class="swap-icon">
								<path
									class="arrow-gave active"
									d="M4 6h16M14 12l6-6"
									stroke-width="2.5"
									fill="none"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<div class="content-cell">
							<div class="tags-row">
								{#each group.gave as entry (entry.id)}
									<div class="tag-item gave">
										<span class="entry-tag">#{entry.tagNumber}</span>
										{#if entry.newMemberId && entry.newMemberId !== memberId && entry.reason !== 'admin_fix'}
											<span class="entry-counterparty"
												>to <span class="counterparty-name"
													>@{userProfiles.getDisplayName(entry.newMemberId)}</span
												></span
											>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{:else if group.got.length > 0}
						<div class="icon-cell">
							<svg viewBox="0 0 24 16" class="swap-icon">
								<path
									class="arrow-gave inactive"
									d="M4 6h16M14 12l6-6"
									stroke-width="2.5"
									fill="none"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<div class="content-cell"></div>
					{/if}

					<!-- META ROW -->
					<div class="icon-cell"></div>
					<div class="content-cell meta-cell">
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
		display: grid;
		grid-template-columns: 1.5rem 1fr;
		column-gap: var(--space-md, 1rem);
		row-gap: 0.125rem;
		align-items: center;
		padding: var(--space-sm, 0.5rem) 0;
		position: relative;
	}

	.icon-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	.content-cell {
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-width: 0;
	}

	.meta-cell {
		margin-top: 0.25rem;
	}

	.swap-icon {
		width: 1.5rem;
		height: 1rem;
		flex-shrink: 0;
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

	.tags-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tag-item {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm, 0.5rem);
		line-height: 1.2;
	}

	.entry-tag {
		font-weight: 700;
		font-size: 1rem;
		min-width: 1.5rem;
		flex-shrink: 0;
	}

	.tag-item.got .entry-tag,
	.tag-item.got .counterparty-name {
		color: var(--guild-success, #48c774);
	}

	.tag-item.gave .entry-tag,
	.tag-item.gave .counterparty-name {
		color: var(--guild-danger, #ff6b6b);
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
		background: rgba(139, 123, 184, 0.15); /* amethyst tint */
		color: var(--guild-secondary, #8b7bb8);
		border: 1px solid rgba(139, 123, 184, 0.3);
	}

	.entry-time {
		font-size: var(--font-xs, 0.75rem);
		color: var(--guild-text-secondary);
	}
</style>
