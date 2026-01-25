<script lang="ts">
  import { page } from '$app/stores';
  import RoundDetail from '$lib/components/round/RoundDetail.svelte';
  import { roundService } from '$lib/stores/round.svelte';

  let roundId = $derived($page.params.id);

  let round = $derived(
    roundService.rounds.find(r => r.id === roundId)
  );
</script>

<svelte:head>
  <title>{round?.title ?? 'Round'} | Frolf Bot</title>
</svelte:head>

<main class="container mx-auto px-4 py-6">
  {#if round}
    <a href="/rounds" class="text-sage-500 hover:underline mb-4 inline-block">
      ← Back to rounds
    </a>
    <RoundDetail {roundId} />
  {:else}
    <div class="text-center py-12">
      <p class="text-slate-400">Round not found</p>
      <a href="/rounds" class="text-sage-500 hover:underline mt-2 inline-block">
        Back to rounds
      </a>
    </div>
  {/if}
</main>
