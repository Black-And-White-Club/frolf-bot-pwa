<script lang="ts">
  let {
    icon = '📭',
    title,
    message,
    action
  }: {
    icon?: string;
    title: string;
    message?: string;
    action?: { label: string; href: string };
  } = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 text-center">
  <span class="text-4xl mb-4">{icon}</span>
  <h3 class="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
  {#if message}
    <p class="text-sm text-slate-400 max-w-sm">{message}</p>
  {/if}
  {#if action}
    <a href={action.href} class="mt-4 text-sage-500 hover:text-sage-400 text-sm font-medium">
      {action.label} →
    </a>
  {/if}
</div>
