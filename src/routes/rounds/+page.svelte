<script lang="ts">
	import RoundList from '$lib/components/round/RoundList.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import { clubService } from '$lib/stores/club.svelte';

	let isAuthenticated = $derived(auth.isAuthenticated);
	let canCreateRounds = $derived(auth.isAuthenticated && auth.activeRole !== 'viewer');
	let createRequested = $derived(page.url.searchParams.get('created') === 'requested');

	function handleRoundSelect(roundId: string) {
		goto(`/rounds/${roundId}`);
	}
</script>

<svelte:head>
	<title>Rounds | {clubService.info?.name ?? 'Frolf Bot'}</title>
	<meta
		name="description"
		content="Browse past disc golf rounds, scores, and course history for your club."
	/>
	<meta property="og:title" content="Rounds | Frolf Bot" />
	<meta
		property="og:description"
		content="Browse past disc golf rounds, scores, and course history for your club."
	/>
</svelte:head>

<main class="container mx-auto px-4 py-6">
	<div class="mb-6 flex items-center justify-between gap-3">
		<h1 class="text-2xl font-bold">Rounds</h1>
		{#if canCreateRounds}
			<a
				href="/rounds/create"
				data-testid="btn-create-round-route"
				class="bg-liquid-skobeloff rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
			>
				Create Round
			</a>
		{/if}
	</div>

	{#if isAuthenticated}
		{#if createRequested}
			<div
				class="mb-4 rounded-lg border border-[#007474]/40 bg-[#007474]/10 px-4 py-3 text-sm text-[#4dd0d0]"
				role="status"
				aria-live="polite"
				data-testid="create-round-requested-banner"
			>
				Round creation requested. It will appear shortly.
			</div>
		{/if}
		<RoundList onSelect={handleRoundSelect} />
	{:else}
		<p class="text-slate-400">Sign in to view rounds</p>
	{/if}
</main>
