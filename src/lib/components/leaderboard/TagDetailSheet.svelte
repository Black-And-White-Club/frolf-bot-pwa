<script lang="ts">
	import { tagStore } from '$lib/stores/tags.svelte';
	import { slide } from 'svelte/transition';

	interface Props {
		memberId: string;
	}

	let { memberId }: Props = $props();

	const memberHistory = $derived(tagStore.selectedMemberHistory);
</script>

<div class="tag-detail-inline" transition:slide={{ duration: 200 }}>
	<div class="history-list">
		{#if tagStore.historyLoading}
			<p class="empty-state">Loading history...</p>
		{:else if memberHistory.length === 0}
			<p class="empty-state">No tag history available.</p>
		{:else}
			{#each memberHistory as entry (entry.id)}
				<div class="history-entry">
					<div class="entry-tag">#{entry.tagNumber}</div>
					<div class="entry-details">
						<span class="entry-reason">{entry.reason}</span>
						<time class="entry-time" datetime={entry.createdAt}>
							{new Date(entry.createdAt).toLocaleDateString()}
						</time>
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
		gap: var(--space-md, 1rem);
		padding: var(--space-xs, 0.25rem) 0;
	}

	.entry-tag {
		font-weight: 700;
		color: var(--guild-accent, #b89b5e);
		min-width: 2.5rem;
	}

	.entry-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.entry-reason {
		font-size: var(--font-sm, 0.875rem);
		color: var(--guild-text);
		text-transform: capitalize;
	}

	.entry-time {
		font-size: var(--font-xs, 0.75rem);
		color: var(--guild-text-secondary);
	}
</style>
