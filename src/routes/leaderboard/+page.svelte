<script lang="ts">
	import LeaderboardView from '$lib/components/leaderboard/LeaderboardView.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	import { clubService } from '$lib/stores/club.svelte';
	
	let id = $derived(auth.user?.activeClubUuid ?? auth.user?.guildId ?? '');
</script>

<svelte:head>
	<title>Leaderboard | {clubService.info?.name ?? 'Frolf Bot'}</title>
	<meta name="description" content="See who's on top — club leaderboard rankings, Elo ratings, and player stats." />
	<meta property="og:title" content="Leaderboard | Frolf Bot" />
	<meta property="og:description" content="See who's on top — club leaderboard rankings, Elo ratings, and player stats." />
</svelte:head>

<main class="container mx-auto px-4 py-6">
	{#if id}
		<LeaderboardView guildId={id} />
	{:else}
		<p class="text-slate-400">Sign in to view leaderboard</p>
	{/if}
</main>
