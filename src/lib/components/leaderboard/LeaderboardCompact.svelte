<script lang="ts">
	import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
	import TagBadge from './TagBadge.svelte';

	let { entries, limit = 10 }: { entries: LeaderboardEntry[]; limit?: number } = $props();

	const topEntries = $derived(entries.slice(0, limit));
</script>

<div class="leaderboard-compact">
	{#each topEntries as entry, i (entry.userId)}
		<div class="entry" class:top-3={i < 3}>
			<div class="tag-number">{entry.tagNumber}</div>
			<span class="name">{entry.displayName ?? `User ${entry.userId}`}</span>
		</div>
	{/each}
</div>

<style>
	.leaderboard-compact {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.entry {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: var(--guild-surface-elevated, #0f1f1f);
		border-radius: 0.5rem;
	}

	.entry.top-3 {
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid rgba(180, 155, 94, 0.3);
	}

	.tag-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--primary, #007474);
		color: white;
		font-size: 0.875rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.entry.top-3 .tag-number {
		background: linear-gradient(135deg, #b89b5e 0%, #7c6b3c 100%);
		box-shadow: 0 2px 8px rgba(184, 155, 94, 0.3);
	}

	.name {
		flex: 1;
		font-size: 0.875rem;
		color: var(--guild-text, #e5e7eb);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
