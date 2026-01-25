<script lang="ts">
  import RoundList from '$lib/components/round/RoundList.svelte';
  import { auth } from '$lib/stores/auth.svelte';

  let guildId = $derived(auth.user?.guildId);

  function handleRoundSelect(roundId: string) {
    window.location.href = `/rounds/${roundId}`;
  }
</script>

<svelte:head>
  <title>Rounds | Frolf Bot</title>
</svelte:head>

<main class="container mx-auto px-4 py-6">
  <h1 class="text-2xl font-bold mb-6">Rounds</h1>

  {#if guildId}
    <RoundList onSelect={handleRoundSelect} />
  {:else}
    <p class="text-slate-400">Sign in to view rounds</p>
  {/if}
</main>
