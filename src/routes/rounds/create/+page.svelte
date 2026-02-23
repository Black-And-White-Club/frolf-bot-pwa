<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { clubService } from '$lib/stores/club.svelte';
	import CreateRoundForm from '$lib/components/round/CreateRoundForm.svelte';

	let canCreateRounds = $derived(auth.isAuthenticated && auth.activeRole !== 'viewer');

	$effect(() => {
		if (auth.status === 'validating') {
			return;
		}
		if (!auth.isAuthenticated || !canCreateRounds) {
			goto('/rounds');
		}
	});

	async function handleCreateSuccess(): Promise<void> {
		await goto('/rounds?created=requested');
	}
</script>

<svelte:head>
	<title>Create Round | {clubService.info?.name ?? 'Frolf Bot'}</title>
</svelte:head>

<main class="create-round-page" data-testid="create-round-page">
	<div class="page-shell">
		<a class="back-link" href="/rounds">← Back to rounds</a>
		<header>
			<h1>Create Round</h1>
			<p>Schedule a new round for your club. Players can RSVP once it is posted.</p>
		</header>

		{#if canCreateRounds}
			<CreateRoundForm onSuccess={handleCreateSuccess} />
		{/if}
	</div>
</main>

<style>
	.create-round-page {
		min-height: 100%;
		padding: 1rem 1rem 2rem;
	}

	.page-shell {
		max-width: 44rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.back-link {
		font-family: var(--font-secondary);
		font-size: 0.9rem;
		color: var(--guild-text-secondary);
		text-decoration: none;
	}

	.back-link:hover {
		color: var(--guild-text);
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(1.5rem, 4vw, 2rem);
		color: var(--guild-text);
	}

	p {
		margin: 0.35rem 0 0;
		font-family: var(--font-secondary);
		color: var(--guild-text-secondary);
		font-size: 0.95rem;
	}

	@media (min-width: 768px) {
		.create-round-page {
			padding: 1.5rem 1rem 2.5rem;
		}
	}
</style>
