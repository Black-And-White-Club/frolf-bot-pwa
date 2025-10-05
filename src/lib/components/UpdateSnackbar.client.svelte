<script lang="ts">
	import { onMount } from 'svelte';

	let Comp: any = null;

	onMount(async () => {
		// Dynamically import the client-only component so it is never imported during SSR
		const mod = await import('./UpdateSnackbar.svelte');
		Comp = mod.default;
	});
</script>

{#if Comp}
	<svelte:component this={Comp} />
{/if}
