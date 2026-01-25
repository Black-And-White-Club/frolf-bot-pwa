<script lang="ts">
  let { isLive = true }: { isLive?: boolean } = $props();
</script>

{#if isLive}
  <div class="flex items-center gap-2 text-xs text-green-400">
    <span class="relative flex h-2 w-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
    <span>Live</span>
  </div>
{/if}
