<script lang="ts">
	import Leaderboard from '$lib/components/leaderboard/Leaderboard.svelte';
	import RoundList from '$lib/components/round/RoundList.svelte';
	import { goto } from '$app/navigation';
	import LeaderboardCompact from '$lib/components/leaderboard/LeaderboardCompact.svelte';
	import TagLeaderboard from '$lib/components/leaderboard/TagLeaderboard.svelte';
	import TagDetailSheet from '$lib/components/leaderboard/TagDetailSheet.svelte';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';

	interface Props {
		mode?: 'default' | 'tv' | 'compact';
	}

	let { mode = 'default' }: Props = $props();

	function handleMemberSelect(memberId: string) {
		tagStore.selectMember(memberId);
	}

	function handleRoundSelect(roundId: string) {
		goto(`/rounds/${roundId}`);
	}

	// Map leaderboard entries to tag members to ensure the tag list is populated
	const tagMembers = $derived(
		leaderboardService.currentView.map((e) => ({
			memberId: e.userId,
			currentTag: e.tagNumber,
			lastActiveAt: undefined
		}))
	);
</script>

<div class="dashboard" class:tv-mode={mode === 'tv'} class:compact-mode={mode === 'compact'}>
	{#if mode === 'default'}
		<!-- Header controls removed (redundant view toggle) -->
	{/if}

	<main class="content">
		{#if mode === 'compact'}
			<LeaderboardCompact entries={leaderboardService.currentView} />
		{:else if mode === 'tv'}
			<div class="tv-layout">
				<div class="leaderboard-section">
					<Leaderboard entries={leaderboardService.currentView.slice(0, 8)} />
				</div>
				<div class="recent-rounds-section">
					<!-- Recent rounds component would go here -->
				</div>
			</div>
		{:else}
			<!-- Default Dashboard Layout -->
			<div class="rounds-section">
				<h2 class="section-heading">Rounds</h2>
				<RoundList onSelect={handleRoundSelect} />
			</div>
			
			<div class="leaderboard-section">
				{#if leaderboardService.viewMode === 'tags'}
					<TagLeaderboard 
						members={tagMembers} 
						onSelectMember={handleMemberSelect} 
					/>
					
					{#if tagStore.selectedMemberId}
						<TagDetailSheet 
							memberId={tagStore.selectedMemberId}
							history={tagStore.selectedMemberHistory}
							onClose={() => tagStore.selectMember(null)}
						/>
					{/if}
				{:else}
					<Leaderboard 
						entries={leaderboardService.currentView} 
						title="Points Leaderboard"
					/>
				{/if}
			</div>
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



	.content {
		position: relative; 
		display: flex;
		flex-direction: column;
		gap: var(--space-lg, 1.5rem);
	}

	@media (min-width: 1024px) {
		.dashboard:not(.tv-mode):not(.compact-mode) .content {
			display: grid;
			grid-template-columns: 1fr 1.5fr;
			align-items: start;
			gap: 2rem;
		}
	}

	.rounds-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md, 1rem);
	}

	.section-heading {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--guild-text);
		margin: 0;
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
