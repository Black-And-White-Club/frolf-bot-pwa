<script lang="ts">
	import LeaderboardView from '$lib/components/leaderboard/LeaderboardView.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	let guildId = $derived(auth.user?.guildId ?? '');
</script>

<svelte:head>
	<title>Leaderboard | Frolf Bot</title>
</svelte:head>

<main class="container mx-auto px-4 py-6">
	{#if guildId}
		<LeaderboardView {guildId} />
	{:else}
		<p class="text-slate-400">Sign in to view leaderboard</p>
	{/if}
</main>
