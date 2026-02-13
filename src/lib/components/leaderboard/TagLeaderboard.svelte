<script lang="ts">
	import { tagStore, type TagListMember } from '$lib/stores/tags.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import ViewToggle from './ViewToggle.svelte';
	import ChevronCollapse from '$lib/components/general/ChevronCollapse.svelte';
	import PlayerRow from './PlayerRow.svelte';

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
					<PlayerRow
						userId={member.memberId}
						name={userProfiles.getDisplayName(member.memberId)}
						rank={member.currentTag ?? undefined}
						highlightFirst={true}
						isCurrentUser={false}
						onclick={() => onSelectMember?.(member.memberId)}
					>
												<button
													class="history-btn"
													title="View Tag History"
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														onSelectMember?.(member.memberId);
													}}
													aria-label="View Tag History"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
														class="text-guild-text-secondary"
													>
														<circle cx="12" cy="12" r="10" />
														<polyline points="12 6 12 12 16 14" />
													</svg>
												</button>
					</PlayerRow>
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
		gap: 0.5rem;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		font-size: 0.875rem;
		color: var(--guild-text-secondary);
	}

		.history-btn {

			background: none;

			border: none;

			padding: 0.5rem;

			margin-left: 0.5rem;

			color: var(--guild-text-secondary);

			display: flex;

			align-items: center;

			border-radius: 4px;

			transition:

				color 0.2s,

				background 0.2s;

		}

	.history-btn:hover {
		color: var(--guild-primary);
		background: rgba(var(--guild-primary-rgb), 0.1);
	}
</style>
