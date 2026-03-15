<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	$effect(() => {
		if (auth.user !== null && auth.bettingAccess.state === 'disabled') {
			void goto('/');
		}
	});
</script>

{@render children()}
