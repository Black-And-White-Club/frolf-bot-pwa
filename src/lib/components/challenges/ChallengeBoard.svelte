<script lang="ts">
	import { resolve } from '$app/paths';
	import ChallengeCard from '$lib/components/challenges/ChallengeCard.svelte';
	import { challengeStore } from '$lib/stores/challenges.svelte';

	type Props = {
		title?: string;
		limit?: number;
		relatedExternalId?: string | null;
		hideEmpty?: boolean;
	};

	let {
		title = 'Challenge Board',
		limit,
		relatedExternalId = null,
		hideEmpty = false
	}: Props = $props();

	const challenges = $derived.by(() => {
		const source = relatedExternalId
			? challengeStore.getChallengesForExternalId(relatedExternalId)
			: challengeStore.board;

		if (typeof limit === 'number') {
			return source.slice(0, limit);
		}

		return source;
	});

	const showViewAllLink = $derived(typeof limit === 'number' || relatedExternalId !== null);
</script>

{#if !hideEmpty || challenges.length > 0}
	<section class="challenge-board" data-testid="challenge-board">
		<header class="challenge-board__header">
			<div>
				<h3>{title}</h3>
				<p>{challenges.length} active challenge{challenges.length === 1 ? '' : 's'}</p>
			</div>
			{#if showViewAllLink}
				<a class="challenge-board__view-all" href={resolve('/challenges')}>View all</a>
			{/if}
		</header>

		{#if challengeStore.successMessage}
			<p class="challenge-board__message challenge-board__message--success">
				{challengeStore.successMessage}
			</p>
		{/if}

		{#if challengeStore.errorMessage}
			<p class="challenge-board__message challenge-board__message--error">
				{challengeStore.errorMessage}
			</p>
		{/if}

		{#if challenges.length === 0}
			<p class="challenge-board__empty">No open or accepted challenges right now.</p>
		{:else}
			<div class="challenge-board__list">
				{#each challenges as challenge (challenge.id)}
					<ChallengeCard {challenge} />
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style>
	.challenge-board {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1rem;
		border: 1px solid var(--guild-border);
		border-radius: 1rem;
		background: var(--guild-surface);
	}

	.challenge-board__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.challenge-board__view-all {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--guild-primary);
		text-decoration: none;
	}

	.challenge-board__view-all:hover {
		text-decoration: underline;
	}

	h3 {
		margin: 0;
		font-size: 1.05rem;
		color: var(--guild-text);
	}

	p {
		margin: 0.2rem 0 0;
		font-size: 0.85rem;
		color: var(--guild-text-secondary);
	}

	.challenge-board__list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.challenge-board__empty {
		padding: 0.4rem 0;
	}

	.challenge-board__message {
		margin: 0;
		padding: 0.75rem 0.9rem;
		border-radius: 0.8rem;
		font-size: 0.85rem;
	}

	.challenge-board__message--success {
		background: rgba(16, 185, 129, 0.1);
		color: #0f766e;
	}

	.challenge-board__message--error {
		background: rgba(220, 38, 38, 0.1);
		color: #b91c1c;
	}
</style>
