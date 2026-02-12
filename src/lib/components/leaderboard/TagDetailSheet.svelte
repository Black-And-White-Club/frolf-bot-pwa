<script lang="ts">
	import type { TagHistoryEntry } from '$lib/stores/tags.svelte';

	interface Props {
		memberId: string;
		history: TagHistoryEntry[];
		onClose?: () => void;
	}

	let { memberId, history, onClose }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose?.();
		}
	}

	const memberHistory = $derived(
		history
			.filter((e) => e.newMemberId === memberId || e.oldMemberId === memberId)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
	);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="tag-detail-sheet" role="dialog" aria-label="Tag History for {memberId}" onkeydown={handleKeydown}>
	<div class="sheet-header">
		<h3>Tag History</h3>
		<button class="close-btn" onclick={() => onClose?.()} type="button" aria-label="Close">✕</button>
	</div>

	<div class="history-list">
		{#if memberHistory.length === 0}
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
	.tag-detail-sheet {
		display: flex;
		flex-direction: column;
		background: var(--color-surface, #0f172a);
		border: 1px solid var(--color-border, rgba(148, 163, 184, 0.1));
		border-radius: var(--radius-lg, 0.75rem);
		overflow: hidden;
		max-height: 24rem;
	}

	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-md, 1rem);
		border-bottom: 1px solid var(--color-border, rgba(148, 163, 184, 0.1));
	}

	.sheet-header h3 {
		margin: 0;
		color: var(--color-text-primary, #e2e8f0);
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--color-text-muted, #94a3b8);
		cursor: pointer;
		font-size: 1.25rem;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: var(--color-text-primary, #e2e8f0);
	}

	.history-list {
		overflow-y: auto;
		padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 0.5rem);
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-muted, #94a3b8);
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
		color: var(--color-gold-accent, #c5a04e);
		min-width: 2.5rem;
	}

	.entry-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.entry-reason {
		font-size: var(--font-sm, 0.875rem);
		color: var(--color-text-primary, #e2e8f0);
		text-transform: capitalize;
	}

	.entry-time {
		font-size: var(--font-xs, 0.75rem);
		color: var(--color-text-muted, #94a3b8);
	}
</style>
