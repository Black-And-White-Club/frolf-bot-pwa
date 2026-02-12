<script lang="ts">
	import { tagStore, type TagListMember } from '$lib/stores/tags.svelte';

	interface Props {
		members?: TagListMember[];
		onSelectMember?: (memberId: string) => void;
	}

	let { members, onSelectMember }: Props = $props();

	const sortedMembers = $derived(members ?? tagStore.sortedTagList);
</script>

<div class="tag-leaderboard">
	<div class="tag-leaderboard-header">
		<h3>Tag Leaderboard</h3>
		<span class="tag-count">{sortedMembers.length} members</span>
	</div>

	<div class="tag-list">
		{#each sortedMembers as member (member.memberId)}
			<div class="tag-row-content">
				<button
					class="tag-row-clickable"
					onclick={() => onSelectMember?.(member.memberId)}
					type="button"
				>
					<span class="tag-number">#{member.currentTag}</span>
					<span class="member-id">{member.memberId}</span>
				</button>
				<button 
					class="history-btn"
					onclick={(e) => { e.stopPropagation(); onSelectMember?.(member.memberId); }}
					type="button"
					aria-label="View History"
					title="View Tag History"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="12 6 12 12 16 14"></polyline>
					</svg>
				</button>
			</div>
		{/each}
	</div>
</div>

<style>
	.tag-leaderboard {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 0.5rem);
	}

	.tag-leaderboard-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
	}

	.tag-leaderboard-header h3 {
		margin: 0;
		font-size: var(--font-lg, 1.125rem);
		color: var(--color-text-primary, #e2e8f0);
	}

	.tag-count {
		font-size: var(--font-sm, 0.875rem);
		color: var(--color-text-muted, #94a3b8);
	}

	.tag-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tag-row-content {
		display: flex;
		align-items: center;
		background: var(--color-surface-elevated, rgba(30, 41, 59, 0.6));
		border: 1px solid var(--color-border, rgba(148, 163, 184, 0.1));
		border-radius: var(--radius-md, 0.5rem);
		transition: all 0.2s ease;
	}
	
	.tag-row-content:hover {
		background: var(--color-surface-hover, rgba(30, 41, 59, 0.8));
		border-color: var(--color-gold-accent, #c5a04e);
	}

	.tag-row-clickable {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-md, 1rem);
		padding: var(--space-sm, 0.5rem) var(--space-md, 1rem);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font: inherit;
	}

	.history-btn {
		background: none;
		border: none;
		padding: 0.5rem;
		margin-right: 0.5rem;
		color: var(--color-text-muted, #94a3b8);
		cursor: pointer;
		display: flex;
		align-items: center;
		border-radius: 4px;
		transition: color 0.2s, background 0.2s;
	}

	.history-btn:hover {
		color: var(--color-text-primary, #e2e8f0);
		background: rgba(255,255,255,0.05);
	}

	.tag-number {
		font-weight: 700;
		color: var(--color-gold-accent, #c5a04e);
		min-width: 2.5rem;
	}

	.member-id {
		color: var(--color-text-primary, #e2e8f0);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
