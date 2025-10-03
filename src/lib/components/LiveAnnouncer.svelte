<script lang="ts">
  import { announcer } from '$lib/stores/announcer'
  let message: string | null = null
  announcer.subscribe((v) => (message = v))
</script>

<!-- Polite live region for non-interruptive updates -->
<div aria-live="polite" aria-atomic="true" class="sr-only" data-testid="live-announcer">
  {#if message}
    <span>{message}</span>
  {/if}
</div>

<style>
  /* Minimal sr-only - visible to screen readers but invisible visually */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
