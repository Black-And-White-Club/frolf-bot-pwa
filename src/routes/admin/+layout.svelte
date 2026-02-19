<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	onMount(async () => {
		const { auth } = await import('$lib/stores/auth.svelte');
		if (!auth.canAdmin) goto('/');
	});
</script>

{@render children?.()}
