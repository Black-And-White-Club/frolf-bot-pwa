<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { MockTransport } from '$lib/stores/mockTransport'

  export let transport: MockTransport
  const dispatch = createEventDispatcher()

  function sendSnapshot() {
    const snap = {
      type: 'snapshot', schema: 'leaderboard.v1', version: 1, ts: new Date().toISOString(), payload: {
        id: 'leaderboard:default', version: 1, lastUpdated: new Date().toISOString(), topTags: [{ tag: 'park', count: 5 }], topPlayers: [{ userId: 'u1', name: 'Sam', score: 10 }]
      }
    }
  transport.send(snap as unknown as import('$lib/types/snapshots').Envelope)
    dispatch('sent', { snap })
  }

  function sendPatch() {
    const patch = { type: 'patch', schema: 'leaderboard.patch.v1', version: 2, ts: new Date().toISOString(), op: 'upsert_player', payload: { userId: 'u2', name: 'Dana', score: 8 } }
  transport.send(patch as unknown as import('$lib/types/snapshots').Envelope)
    dispatch('sent', { patch })
  }
</script>

<div class="controls">
  <button on:click={sendSnapshot}>Send Snapshot</button>
  <button on:click={sendPatch}>Send Patch</button>
</div>

<style>
button { margin-right: .5rem }
</style>
