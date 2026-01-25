<script lang="ts">
  let { trigger }: { trigger: unknown } = $props();
  let flash = $state(false);

  $effect(() => {
    // Re-run when trigger changes
    trigger;
    flash = true;
    const timeout = setTimeout(() => (flash = false), 500);
    return () => clearTimeout(timeout);
  });
</script>

<div class:flash class="transition-colors duration-500">
  <slot />
</div>

<style>
  .flash {
    background-color: rgba(74, 222, 128, 0.1);
  }
</style>
