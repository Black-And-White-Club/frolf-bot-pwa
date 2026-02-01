<script lang="ts">
	let {
		variant = 'card',
		count = 1
	}: {
		variant?: 'card' | 'row' | 'text' | 'avatar';
		count?: number;
	} = $props();
</script>

{#each Array.from({ length: count }, (_, i) => i) as i (i)}
	{#if variant === 'card'}
		<div class="bg-forest-800 mb-4 animate-pulse rounded-xl p-4">
			<div class="bg-forest-700 mb-3 h-4 w-3/4 rounded"></div>
			<div class="bg-forest-700 mb-2 h-3 w-1/2 rounded"></div>
			<div class="bg-forest-700 h-3 w-1/4 rounded"></div>
		</div>
	{:else if variant === 'row'}
		<div class="flex animate-pulse items-center gap-4 p-3">
			<div class="bg-forest-700 h-10 w-10 rounded-full"></div>
			<div class="flex-1">
				<div class="bg-forest-700 mb-2 h-4 w-32 rounded"></div>
				<div class="bg-forest-700 h-3 w-20 rounded"></div>
			</div>
		</div>
	{:else if variant === 'avatar'}
		<div class="bg-forest-700 h-10 w-10 animate-pulse rounded-full"></div>
	{:else}
		<div class="bg-forest-700 mb-2 h-4 w-full animate-pulse rounded"></div>
	{/if}
{/each}
