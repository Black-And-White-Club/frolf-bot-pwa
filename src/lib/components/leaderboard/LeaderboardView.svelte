<script lang="ts">
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import { tagStore } from '$lib/stores/tags.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import PlayerRow from './PlayerRow.svelte';
	import MovementIndicator from './MovementIndicator.svelte';
	import TagBadge from './TagBadge.svelte';
	import ViewToggle from './ViewToggle.svelte';
	import TagDetailSheet from './TagDetailSheet.svelte';

	let { guildId }: { guildId?: string } = $props();

	function handleRowClick(userId: string) {
		if (tagStore.selectedMemberId === userId) {
			tagStore.selectMember(null);
		} else {
			if (!guildId) {
				return;
			}
			tagStore.selectMember(userId, guildId);
			tagStore.fetchTagHistory(guildId, userId);
		}
	}

	let sortedEntries = $derived(leaderboardService.currentView);
	let topThree = $derived(sortedEntries.slice(0, 3));

	let limit = $state(50);
	const displayEntries = $derived(sortedEntries.slice(0, limit));
	const hasMore = $derived(limit < sortedEntries.length);

	function loadMore() {
		limit += 50;
	}

	let lastUpdated = $derived(
		leaderboardService.snapshot?.lastUpdated
			? new Intl.DateTimeFormat('en-US', {
					dateStyle: 'medium',
					timeStyle: 'short'
				}).format(new Date(leaderboardService.snapshot.lastUpdated))
			: null
	);
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') tagStore.selectMember(null);
	}}
/>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">
			{leaderboardService.viewMode === 'tags' ? 'Tag Leaderboard' : 'Points Leaderboard'}
		</h1>
		<div class="flex items-center gap-4">
			<ViewToggle
				mode={leaderboardService.viewMode}
				onchange={(m) => leaderboardService.setViewMode(m)}
			/>
			{#if lastUpdated}
				<span class="text-sm text-slate-400">Last updated: {lastUpdated}</span>
			{/if}
		</div>
	</div>

	{#if topThree.length > 0}
		<div
			class="bg-liquid-skobeloff border-sage-600/20 flex justify-center gap-8 rounded-lg border p-6"
			data-testid="leaderboard-top-three"
		>
			{#each topThree as entry, index (entry.userId)}
				<TagBadge tag={entry} rank={index + 1} size="lg" />
			{/each}
		</div>
	{/if}

	<!-- Full Rankings -->
	<div class="space-y-2">
		{#each displayEntries as entry, index (entry.userId)}
			{@const displayName = userProfiles.getDisplayName(entry.userId)}
			{@const movement = leaderboardService.getMovementIndicator(entry)}
			<PlayerRow
				userId={entry.userId}
				name={displayName ?? entry.displayName ?? `Player #${entry.tagNumber}`}
				rank={index + 1}
				avatarUrl={userProfiles.getAvatarUrl(entry.userId)}
				totalPoints={entry.totalPoints}
				roundsPlayed={entry.roundsPlayed}
				isCurrentUser={auth.user?.id === entry.userId}
				testid={`leaderboard-row-${entry.userId}`}
				onclick={() => handleRowClick(entry.userId)}
			>
				<MovementIndicator {entry} {movement} />
			</PlayerRow>
			{#if tagStore.selectedMemberId === entry.userId}
				<div class="row-expansion">
					<TagDetailSheet memberId={entry.userId} />
				</div>
			{/if}
		{/each}
	</div>

	{#if hasMore}
		<div class="mt-6 flex justify-center">
			<button
				class="bg-sage-700/50 hover:bg-sage-600 border-sage-600/30 text-guild-text rounded-md border px-4 py-2 text-sm font-medium transition-colors"
				onclick={loadMore}
			>
				Load More
			</button>
		</div>
	{/if}
</div>

<style>
	.row-expansion {
		margin-top: -0.5rem;
		margin-bottom: 0.5rem;
		padding: 0 0.5rem;
	}
</style>
