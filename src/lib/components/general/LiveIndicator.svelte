<script lang="ts">
	let { isLive = true }: { isLive?: boolean } = $props();
</script>

{#if isLive}
	<div
		class="flex items-center gap-2 text-xs font-medium text-[var(--guild-secondary)] drop-shadow-[0_0_8px_rgba(139,123,184,0.6)]"
	>
		<span class="relative flex h-2 w-2">
			<span
				class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--guild-secondary)] opacity-75"
			></span>
			<span
				class="shadow-aura relative inline-flex h-2 w-2 rounded-full bg-[var(--guild-secondary)]"
			></span>
		</span>
		<span class="font-secondary tracking-wider uppercase">Live</span>
	</div>
{/if}
