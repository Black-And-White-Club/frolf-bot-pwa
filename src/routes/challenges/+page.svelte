<script lang="ts">
	import ChallengeBoard from '$lib/components/challenges/ChallengeBoard.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { challengeStore } from '$lib/stores/challenges.svelte';
	import { clubService } from '$lib/stores/club.svelte';
	import { resolveRequestIdentity } from '$lib/utils/requestIdentity';

	const identity = $derived(resolveRequestIdentity(auth.user));
	const canViewChallenges = $derived(auth.isAuthenticated && identity !== null);

	$effect(() => {
		if (!canViewChallenges) {
			return;
		}

		void challengeStore.loadBoard();
	});
</script>

<svelte:head>
	<title>Challenges | {clubService.info?.name ?? 'Frolf Bot'}</title>
	<meta
		name="description"
		content="Track open and accepted tag challenges for your club, then jump into the full detail for each match."
	/>
</svelte:head>

<main class="container mx-auto px-4 py-6" data-testid="challenges-page">
	<div class="mb-6 space-y-2">
		<h1 class="text-2xl font-bold">Challenges</h1>
		<p class="max-w-2xl text-sm text-slate-400">
			Open and accepted matches stay on the board. Archived challenges remain available from their
			detail pages.
		</p>
	</div>

	{#if canViewChallenges}
		<ChallengeBoard title="Active Challenges" />
	{:else}
		<p class="text-slate-400">Sign in to view challenges</p>
	{/if}
</main>
