<script lang="ts">
	import Leaderboard from '$lib/components/leaderboard/Leaderboard.svelte';
	import ViewToggle from '$lib/components/leaderboard/ViewToggle.svelte';
	import LeaderboardCompact from '$lib/components/leaderboard/LeaderboardCompact.svelte';
	import TagLeaderboard from '$lib/components/leaderboard/TagLeaderboard.svelte';
	import TagDetailSheet from '$lib/components/leaderboard/TagDetailSheet.svelte';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';

	interface Props {
		mode?: 'default' | 'tv' | 'compact';
	}

	let { mode = 'default' }: Props = $props();

	// View state
	// let viewMode = $state<'tags' | 'points'>('tags'); // REMOVED: Using leaderboardService.viewMode

	function handleMemberSelect(memberId: string) {
		tagStore.selectMember(memberId);
	}
</script>

<div class="dashboard" class:tv-mode={mode === 'tv'} class:compact-mode={mode === 'compact'}>
	{#if mode === 'default'}
		<div class="header-controls">
			<ViewToggle
				mode={leaderboardService.viewMode}
				onchange={(m) => leaderboardService.setViewMode(m)}
			/>
		</div>
	{/if}

	<main class="content">
		{#if leaderboardService.viewMode === 'tags' && mode !== 'compact'}
			<TagLeaderboard 
				members={tagStore.memberList} 
				onSelectMember={handleMemberSelect} 
			/>
			
			{#if tagStore.selectedMemberId}
				<TagDetailSheet 
					memberId={tagStore.selectedMemberId}
					history={tagStore.selectedMemberHistory}
					onClose={() => tagStore.selectMember(null)}
				/>
			{/if}
		{:else if mode === 'compact'}
			<LeaderboardCompact entries={leaderboardService.currentView} />
		{:else}
			<!-- Points / Season View -->
			{#if mode === 'tv'}
				<div class="tv-layout">
					<div class="leaderboard-section">
						<Leaderboard entries={leaderboardService.currentView.slice(0, 8)} />
					</div>
					<div class="recent-rounds-section">
						<!-- Recent rounds component would go here -->
					</div>
				</div>
			{:else}
				<Leaderboard entries={leaderboardService.currentView} />
			{/if}
		{/if}
	</main>
</div>

<style>
	.dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-md, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg, 1.5rem);
	}

	.header-controls {
		display: flex;
		justify-content: flex-end;
		margin-bottom: var(--space-sm, 0.5rem);
	}

	.content {
		position: relative; 
	}

	/* TV Mode Styles */
	.tv-mode {
		max-width: none;
		padding: var(--space-xl, 2rem);
		height: 100vh;
		box-sizing: border-box;
		background: #0a0f1c; /* Darker background for TV */
	}

	.tv-layout {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: var(--space-xl, 2rem);
		height: 100%;
	}

	/* Compact Mode Styles */
	.compact-mode {
		padding: 0;
		gap: 0;
	}
</style>
