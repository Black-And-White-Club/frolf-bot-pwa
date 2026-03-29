<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	$effect(() => {
		if (!browser || auth.status === 'validating') {
			return;
		}

		if (!auth.canAdmin) {
			goto('/');
		}
	});
</script>

{@render children?.()}
