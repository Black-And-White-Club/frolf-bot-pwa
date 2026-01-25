<script lang="ts">
  let {
    title = 'Something went wrong',
    message,
    onRetry
  }: {
    title?: string;
    message?: string;
    onRetry?: () => void;
  } = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 text-center">
  <span class="text-4xl mb-4">⚠️</span>
  <h3 class="text-lg font-semibold text-red-400 mb-2">{title}</h3>
  {#if message}
    <p class="text-sm text-slate-400 max-w-sm mb-4">{message}</p>
  {/if}
  {#if onRetry}
    <button
      onclick={onRetry}
      class="px-4 py-2 bg-forest-700 hover:bg-forest-600 rounded-lg text-sm font-medium transition-colors"
    >
      Try again
    </button>
  {/if}
</div>
