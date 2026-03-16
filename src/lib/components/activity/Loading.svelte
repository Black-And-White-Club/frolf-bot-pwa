<script lang="ts">
	let { message = 'Loading…' }: { message?: string } = $props();
</script>

<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6">
	<div
		class="h-8 w-8 animate-spin rounded-full border-2 border-[--guild-border] border-t-[--guild-primary]"
	></div>
	<p class="text-sm text-[--guild-text-secondary]">{message}</p>
</div>
