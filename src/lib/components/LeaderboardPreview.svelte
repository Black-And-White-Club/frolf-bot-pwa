<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { Transport } from '../stores/leaderboardPreviewStore'
  import { createLeaderboardPreviewStore } from '../stores/leaderboardPreviewStore'

  export let transport: Transport

  const store = createLeaderboardPreviewStore(transport)
  let state: { snapshot: any; lastVersion: number } = { snapshot: null, lastVersion: 0 }

  const unsubscribe = store.subscribe(s => { state = s })

  onMount(() => { store.start() })
  onDestroy(() => { store.stop(); unsubscribe() })
</script>

<div class="leaderboard-preview">
  {#if state.snapshot}
    <div class="tags">
      {#each state.snapshot.topTags as t}
        <span class="tag">{t.tag} ({t.count})</span>
      {/each}
    </div>
    <ul class="players">
      {#each state.snapshot.topPlayers as p}
        <li class="player">{p.name} — {p.score}</li>
      {/each}
    </ul>
    <div class="meta">v{state.lastVersion}</div>
  {:else}
    <div class="empty">No snapshot</div>
  {/if}
</div>

<style>
.leaderboard-preview { padding: 0.5rem }
.tag { display: inline-block; margin-right: .5rem; background: #eef; padding: .2rem .4rem; border-radius: .25rem }
.players { list-style: none; padding: 0; }
.player { padding: .2rem 0 }
.meta { margin-top: .5rem; font-size: .8rem; color: #666 }
</style>
