<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		message?: string;
		dismissible?: boolean;
	};

	let { message, dismissible }: Props = $props();

	let Comp = $state<any>(null);

	onMount(async () => {
		// Dynamically import the client-only component so it is never imported during SSR
		const mod = await import('./UpdateSnackbar.svelte');
		Comp = mod.default;
	});
</script>

{#if Comp}
	<Comp {message} {dismissible} />
{/if}
