<script lang="ts">
	let { message = 'Authentication failed.', onRetry }: { message?: string; onRetry: () => void } =
		$props();
</script>

<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
	<div class="text-3xl">⚠️</div>
	<p class="text-sm font-medium text-[--guild-error-text]">{message}</p>
	<button
		onclick={onRetry}
		class="rounded-lg bg-[--guild-primary] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
	>
		Try again
	</button>
</div>
