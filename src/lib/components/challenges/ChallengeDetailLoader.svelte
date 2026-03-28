<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { challengeStore } from '$lib/stores/challenges.svelte';
	import { nats } from '$lib/stores/nats.svelte';

	type Props = {
		challengeId: string;
	};

	let { challengeId }: Props = $props();

	$effect(() => {
		if (!challengeId || !auth.isAuthenticated || !nats.isConnected) {
			return;
		}

		void challengeStore.loadDetail(challengeId);

		return () => {
			challengeStore.clearDetail(challengeId);
		};
	});
</script>
