<script lang="ts">
  import ConnectGuild from './ConnectGuild.svelte'
  import type { Session } from '$lib/stores/auth'
  export let session: Session | null
  export let listGuilds: () => Promise<any>
  export let linkGuild: (id: string) => Promise<any>
</script>

{#if !session}
  <div class="not-auth">Please log in to continue.</div>
{:else}
  <div class="wizard">
    <div class="header">
      <h3>Welcome, {session.user.name}</h3>
      <p class="subtitle">Link a server you manage or invite the bot to your server.</p>
    </div>
    <ConnectGuild {listGuilds} {linkGuild} />
    <div class="invite">
      <button class="btn-invite" on:click={() => alert('Invite flow (mock)')}>Invite bot to server</button>
    </div>
  </div>
{/if}

<style>
.wizard { background: var(--card-bg, #fff); padding: 1rem; border-radius: .5rem }
.header { margin-bottom: .5rem }
.subtitle { color: #666; margin-top: .25rem }
.invite { margin-top: 1rem }
.btn-invite { background: #06b; color: white; border: none; padding: .4rem .8rem; border-radius: .3rem }
.not-auth { color: #666 }
</style>
