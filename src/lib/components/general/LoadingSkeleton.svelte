<script lang="ts">
  let {
    variant = 'card',
    count = 1
  }: {
    variant?: 'card' | 'row' | 'text' | 'avatar';
    count?: number;
  } = $props();
</script>

{#each Array(count) as _, i}
  {#if variant === 'card'}
    <div class="animate-pulse bg-forest-800 rounded-xl p-4 mb-4">
      <div class="h-4 bg-forest-700 rounded w-3/4 mb-3"></div>
      <div class="h-3 bg-forest-700 rounded w-1/2 mb-2"></div>
      <div class="h-3 bg-forest-700 rounded w-1/4"></div>
    </div>
  {:else if variant === 'row'}
    <div class="animate-pulse flex items-center gap-4 p-3">
      <div class="w-10 h-10 bg-forest-700 rounded-full"></div>
      <div class="flex-1">
        <div class="h-4 bg-forest-700 rounded w-32 mb-2"></div>
        <div class="h-3 bg-forest-700 rounded w-20"></div>
      </div>
    </div>
  {:else if variant === 'avatar'}
    <div class="animate-pulse w-10 h-10 bg-forest-700 rounded-full"></div>
  {:else}
    <div class="animate-pulse h-4 bg-forest-700 rounded w-full mb-2"></div>
  {/if}
{/each}
