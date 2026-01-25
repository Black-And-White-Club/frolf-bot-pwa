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
	<span class="mb-4 text-4xl">⚠️</span>
	<h3 class="mb-2 text-lg font-semibold text-red-400">{title}</h3>
	{#if message}
		<p class="mb-4 max-w-sm text-sm text-slate-400">{message}</p>
	{/if}
	{#if onRetry}
		<button
			onclick={onRetry}
			class="bg-forest-700 hover:bg-forest-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
		>
			Try again
		</button>
	{/if}
</div>
