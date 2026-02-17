<script lang="ts">
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import { leaderboardService } from '$lib/stores/leaderboard.svelte';
	import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
	import ViewToggle from './ViewToggle.svelte';

	let {
		entries,
		limit = 10,
		mode
	}: { entries: LeaderboardEntry[]; limit?: number; mode?: 'tags' | 'points' } = $props();

	const currentMode = $derived(mode ?? leaderboardService.viewMode);
	const topEntries = $derived(entries.slice(0, limit));
	const isSeasonMode = $derived(currentMode === 'points');
</script>

<div class="leaderboard-compact">
	<div class="compact-header">
		<ViewToggle mode={currentMode} onchange={(m) => leaderboardService.setViewMode(m)} />
	</div>

	{#each topEntries as entry, i (entry.userId)}
		<div class="entry" class:rank-1={i === 0} class:rank-2={i === 1} class:rank-3={i === 2}>
			<div class="tag-number">{isSeasonMode ? i + 1 : entry.tagNumber}</div>
			<div class="info">
				<span class="name">{userProfiles.getDisplayName(entry.userId)}</span>
				<span class="points">{entry.totalPoints} pts</span>
				{#if entry.roundsPlayed}
					<span class="rounds">{entry.roundsPlayed} rds</span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.leaderboard-compact {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.compact-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.25rem;
	}

	.entry {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: var(--guild-surface-elevated, #0f1f1f);
		border-radius: 0.5rem;
	}

	.entry.rank-1 {
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid rgba(184, 155, 94, 0.3);
	}
	.entry.rank-2 {
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid rgba(201, 201, 201, 0.3);
	}
	.entry.rank-3 {
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid rgba(179, 116, 74, 0.3);
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

	.entry.rank-1 .tag-number {
		background: linear-gradient(135deg, #b89b5e 0%, #7c6b3c 100%);
		box-shadow: 0 2px 8px rgba(184, 155, 94, 0.3);
	}
	.entry.rank-2 .tag-number {
		background: linear-gradient(135deg, #c9c9c9 0%, #8f8f8f 100%);
		box-shadow: 0 2px 8px rgba(201, 201, 201, 0.3);
	}
	.entry.rank-3 .tag-number {
		background: linear-gradient(135deg, #b3744a 0%, #7c4e2e 100%);
		box-shadow: 0 2px 8px rgba(179, 116, 74, 0.3);
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.name {
		font-family: var(--font-secondary, 'Space Grotesk', sans-serif);
		font-size: 0.875rem;
		color: var(--guild-text, #e5e7eb);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.points {
		font-family: var(--font-display, 'Fraunces', serif);
		font-size: 0.75rem;
		color: var(--guild-accent, #b89b5e);
		font-weight: 700;
	}

	.rounds {
		font-family: var(--font-secondary, 'Space Grotesk', sans-serif);
		font-size: 0.625rem;
		color: var(--guild-text-secondary, #9ca3af);
		font-weight: 500;
	}
</style>
