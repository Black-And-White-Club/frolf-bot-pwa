<script lang="ts">
	import { tagStore, type TagListMember } from '$lib/stores/tags.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import ViewToggle from './ViewToggle.svelte';
	import ChevronCollapse from '$lib/components/general/ChevronCollapse.svelte';

	interface Props {
		members?: TagListMember[];
		onSelectMember?: (memberId: string) => void;
	}

	let { members, onSelectMember }: Props = $props();

	let collapsed = $state(false);

	const sortedMembers = $derived(members ?? tagStore.sortedTagList);

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class="leaderboard-container">
	<div class="leaderboard-header">
		<div class="title-group">
			<h3 class="leaderboard-title">Tag Leaderboard</h3>
			<span class="tag-count">{sortedMembers.length} members</span>
		</div>

		<div class="header-controls">
			<ViewToggle
				mode={leaderboardService.viewMode}
				onchange={(m) => leaderboardService.setViewMode(m)}
			/>
			
			<ChevronCollapse
				{collapsed}
				disabled={false}
				ariaControls="tag-list"
				ariaLabel={collapsed ? 'Expand tag board' : 'Collapse tag board'}
				onclick={toggleCollapse}
			/>
		</div>
	</div>

	{#if !collapsed}
		<div class="tag-list" id="tag-list">
			{#if sortedMembers.length === 0}
				<p class="empty-state">No tags assigned yet.</p>
			{:else}
				{#each sortedMembers as member (member.memberId)}
					<div class="tag-row-content">
						<button
							class="tag-row-clickable"
							onclick={() => onSelectMember?.(member.memberId)}
							type="button"
						>
							<span class="tag-number">#{member.currentTag}</span>
							<div class="member-info">
								<span class="display-name">{userProfiles.getDisplayName(member.memberId)}</span>
								<span class="member-id-sub">{member.memberId}</span>
							</div>
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
			{/if}
		</div>
	{/if}
</div>

<style>
	.leaderboard-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		/* Card styling so the leaderboard appears like other cards */
		background: var(--guild-surface);
		border: 1px solid var(--guild-border);
		border-radius: 0.75rem;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.leaderboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.title-group {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.leaderboard-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--guild-text);
		margin: 0;
	}

	.tag-count {
		font-size: 0.875rem;
		color: var(--guild-text-muted);
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.tag-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		font-size: 0.875rem;
		color: var(--guild-text-secondary);
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
		min-width: 0; /* Enable truncation in children */
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
		font-size: 1.1rem;
	}

	.member-info {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.display-name {
		color: var(--guild-text);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.member-id-sub {
		color: var(--guild-text-muted);
		font-size: 0.75rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
