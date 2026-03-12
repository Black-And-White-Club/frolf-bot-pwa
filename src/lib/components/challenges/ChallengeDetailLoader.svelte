<script lang="ts">
	import { onMount } from 'svelte';
	import { challengeStore } from '$lib/stores/challenges.svelte';

	type Props = {
		challengeId: string;
	};

	let { challengeId }: Props = $props();

	onMount(() => {
		if (!challengeId) {
			return;
		}

		void challengeStore.loadDetail(challengeId);

		return () => {
			challengeStore.clearDetail(challengeId);
		};
	});
</script>
