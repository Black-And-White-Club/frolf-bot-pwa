<script lang="ts">
	import type { Transport, LeaderboardState } from '$lib/stores/leaderboardPreviewStore';
	import { createLeaderboardPreviewStore } from '$lib/stores/leaderboardPreviewStore';

	type Props = {
		transport: Transport;
	};

	let { transport }: Props = $props();

	let state: LeaderboardState = $state({ snapshot: null, lastVersion: 0 });

	$effect(() => {
		const store = createLeaderboardPreviewStore(transport);
		store.start();

		const unsubscribe = store.subscribe((s) => {
			state = s;
		});

		return () => {
			store.stop();
			unsubscribe();
		};
	});
</script>

<div class="leaderboard-preview">
	{#if state.snapshot}
		<div class="tags">
			{#each state.snapshot.topTags as t (t.tag)}
				<span class="tag">{t.tag} ({t.count})</span>
			{/each}
		</div>
		<ul class="players">
			{#each state.snapshot.topPlayers as p (p.name)}
				<li class="player">{p.name} — {p.score}</li>
			{/each}
		</ul>
		<div class="meta">v{state.lastVersion}</div>
	{:else}
		<div class="empty">No snapshot</div>
	{/if}
</div>

<style>
	.leaderboard-preview {
		padding: 0.5rem;
	}
	.tag {
		display: inline-block;
		margin-right: 0.5rem;
		background: var(--guild-secondary);
		color: var(--guild-surface);
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-weight: 500;
	}
	.players {
		list-style: none;
		padding: 0;
	}
	.player {
		padding: 0.2rem 0;
		color: var(--guild-text);
	}
	.meta {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: var(--guild-text-secondary);
	}
	.empty {
		color: var(--guild-text-secondary);
		text-align: center;
		padding: 1rem;
	}
</style>
