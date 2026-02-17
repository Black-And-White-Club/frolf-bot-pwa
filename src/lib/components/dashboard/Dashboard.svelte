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
				<div class="tv-column leaderboard-column">
					{#if leaderboardService.viewMode === 'tags'}
						<TagLeaderboard members={tagMembers} onSelectMember={handleMemberSelect} />

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
							limit={15}
							title="Points Leaderboard"
						/>
					{/if}
				</div>
				<div class="tv-column rounds-column">
					<!-- Reusing RoundList which handles fetching and display of Live/Upcoming/Recent -->
					<div class="rounds-wrapper">
						<RoundList onSelect={handleRoundSelect} />
					</div>
				</div>
			</div>
		{:else}
			<!-- Default Dashboard Layout -->
			<div class="rounds-section">
				<RoundList onSelect={handleRoundSelect} />
			</div>

			<div class="leaderboard-section">
				{#if leaderboardService.viewMode === 'tags'}
					<TagLeaderboard members={tagMembers} onSelectMember={handleMemberSelect} />

					{#if tagStore.selectedMemberId}
						<TagDetailSheet
							memberId={tagStore.selectedMemberId}
							history={tagStore.selectedMemberHistory}
							onClose={() => tagStore.selectMember(null)}
						/>
					{/if}
				{:else}
					<Leaderboard entries={leaderboardService.currentView} title="Points Leaderboard" />
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

	/* Removed section-heading */

	/* TV Mode Styles */
	:global(.app-main:has(.tv-mode)) {
		max-width: none !important;
		padding: 0 !important;
	}

	.tv-mode .content {
		flex: 1;
		min-height: 0;
	}

	.tv-mode {
		max-width: none;
		padding: var(--space-xl, 2rem);
		height: 100vh;
		width: 100vw;
		box-sizing: border-box;
		background:
			radial-gradient(circle at top right, rgba(0, 116, 116, 0.05), transparent),
			var(--guild-background);
		overflow: hidden; /* Prevent scrolling if everything fits */
	}

	/* Hide specific interactive elements in TV mode; .header-controls remain visible for ViewToggle */
	.tv-mode :global(.chevron-collapse),
	.tv-mode :global(.view-all-btn) {
		display: none !important;
	}

	.tv-layout {
		display: grid;
		gap: var(--space-xl, 2rem);
		height: 100%;
		width: 100%;
	}

	/* Landscape (Default TV) */
	@media (orientation: landscape) {
		.tv-layout {
			grid-template-columns: 2fr 1.2fr; /* Leaderboard gets more space */
			grid-template-rows: 1fr;
		}

		/* Ensure columns scroll independently if needed */
		.tv-column {
			height: 100%;
			overflow-y: auto;
			padding-right: 0.5rem; /* Space for scrollbar */
		}
	}

	/* Portrait (Vertical TV) */
	@media (orientation: portrait) {
		.tv-mode {
			height: auto;
			min-height: 100vh;
			overflow-y: auto; /* Allow window scrolling */
		}

		.tv-layout {
			grid-template-columns: 1fr;
			grid-template-rows: min-content 1fr; /* Leaderboard takes what it needs, Rounds take rest */
			height: auto; /* Let it grow */
		}

		.tv-column {
			height: auto; /* Don't force internal scrolling */
			overflow-y: visible;
		}
	}

	/* Compact Mode Styles */
	.compact-mode {
		padding: 0;
		gap: 0;
	}
</style>
