<script lang="ts">
	import RoundList from '$lib/components/round/RoundList.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	import { clubService } from '$lib/stores/club.svelte';

	let isAuthenticated = $derived(auth.isAuthenticated);

	function handleRoundSelect(roundId: string) {
		window.location.href = `/rounds/${roundId}`;
	}
</script>

<svelte:head>
	<title>Rounds | {clubService.info?.name ?? 'Frolf Bot'}</title>
</svelte:head>

<main class="container mx-auto px-4 py-6">
	<h1 class="mb-6 text-2xl font-bold">Rounds</h1>

	{#if isAuthenticated}
		<RoundList onSelect={handleRoundSelect} />
	{:else}
		<p class="text-slate-400">Sign in to view rounds</p>
	{/if}
</main>
