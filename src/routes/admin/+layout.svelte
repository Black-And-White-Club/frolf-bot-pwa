<script lang="ts">
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	$effect(() => {
		if (!browser || auth.status === 'validating') {
			return;
		}

		if (!auth.canAdmin) {
			window.location.replace('/');
		}
	});
</script>

{@render children?.()}
