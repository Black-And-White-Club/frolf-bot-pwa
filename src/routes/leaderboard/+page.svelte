<script lang="ts">
	import LeaderboardView from '$lib/components/leaderboard/LeaderboardView.svelte';
	import { auth } from '$lib/stores/auth.svelte';

	import { guildService } from '$lib/stores/guild.svelte';
	
	let id = $derived(auth.user?.activeClubUuid ?? auth.user?.guildId ?? '');
</script>

<svelte:head>
	<title>Leaderboard | {guildService.info?.name ?? 'Frolf Bot'}</title>
</svelte:head>

<main class="container mx-auto px-4 py-6">
	{#if id}
		<LeaderboardView guildId={id} />
	{:else}
		<p class="text-slate-400">Sign in to view leaderboard</p>
	{/if}
</main>
