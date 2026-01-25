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
	<span class="mb-4 text-4xl">{icon}</span>
	<h3 class="mb-2 text-lg font-semibold text-slate-200">{title}</h3>
	{#if message}
		<p class="max-w-sm text-sm text-slate-400">{message}</p>
	{/if}
	{#if action}
		<a href={action.href} class="text-sage-500 hover:text-sage-400 mt-4 text-sm font-medium">
			{action.label} →
		</a>
	{/if}
</div>
