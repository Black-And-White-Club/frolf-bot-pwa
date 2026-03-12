<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ChallengeCard from '$lib/components/challenges/ChallengeCard.svelte';
	import ChallengeDetailLoader from '$lib/components/challenges/ChallengeDetailLoader.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import {
		challengeStore,
		type ChallengeDetail,
		type ChallengeSummary
	} from '$lib/stores/challenges.svelte';
	import { clubService } from '$lib/stores/club.svelte';
	import { nats } from '$lib/stores/nats.svelte';
	import { roundService } from '$lib/stores/round.svelte';
	import { resolveRequestIdentity } from '$lib/utils/requestIdentity';

	const identity = $derived(resolveRequestIdentity(auth.user));
	const challengeId = $derived(page.params.id?.trim() ?? '');
	const roundRequested = $derived(page.url.searchParams.get('created') === 'requested');
	const detailRequestKey = $derived(
		auth.isAuthenticated && identity && challengeId && nats.isConnected
			? `${identity.requestSubjectId}:${challengeId}`
			: null
	);

	const detail = $derived(challengeStore.detail?.id === challengeId ? challengeStore.detail : null);
	const challenge = $derived.by(() => {
		return (
			detail ??
			(challengeStore.getChallengeById(challengeId) as ChallengeSummary | ChallengeDetail | null)
		);
	});
	const linkedRound = $derived(
		challenge?.linkedRound?.roundId
			? (roundService.rounds.find((round) => round.id === challenge.linkedRound?.roundId) ?? null)
			: null
	);

	function formatTimestamp(value: string | null | undefined): string {
		if (!value) {
			return 'Not recorded';
		}

		return new Date(value).toLocaleString([], {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function roundHref(roundId: string): string {
		return `/rounds/${roundId}`;
	}

	type DetailItem = {
		label: string;
		value: string;
		href?: string;
	};

	function createTimelineItem(label: string, value: string, href?: string): DetailItem {
		return { label, value, href };
	}

	function buildOpenedItem(
		challenge: ChallengeSummary | ChallengeDetail | null
	): readonly DetailItem[] {
		if (!challenge) {
			return [];
		}

		return [createTimelineItem('Opened', formatTimestamp(challenge.openedAt))];
	}

	function buildAcceptedItem(
		challenge: ChallengeSummary | ChallengeDetail | null
	): readonly DetailItem[] {
		if (!challenge?.acceptedAt) {
			return [];
		}

		return [createTimelineItem('Accepted', formatTimestamp(challenge.acceptedAt))];
	}

	function buildCompletedItem(detail: ChallengeDetail | null): readonly DetailItem[] {
		if (!detail?.completedAt) {
			return [];
		}

		return [createTimelineItem('Completed', formatTimestamp(detail.completedAt))];
	}

	function buildHiddenItem(detail: ChallengeDetail | null): readonly DetailItem[] {
		if (!detail?.hiddenAt) {
			return [];
		}

		return [createTimelineItem('Hidden', formatTimestamp(detail.hiddenAt))];
	}

	function buildRoundItem(
		challenge: ChallengeSummary | ChallengeDetail | null,
		linkedRound: { title?: string | null } | null
	): readonly DetailItem[] {
		const roundId = challenge?.linkedRound?.roundId;
		if (!roundId) {
			return [];
		}

		return [
			createTimelineItem(
				challenge.linkedRound?.isActive ? 'Linked round' : 'Last linked round',
				linkedRound?.title ?? roundId,
				resolve(roundHref(roundId))
			)
		];
	}

	function buildMessageBindingItem(detail: ChallengeDetail | null): readonly DetailItem[] {
		if (!detail?.messageBinding) {
			return [];
		}

		return [
			createTimelineItem(
				'Discord message',
				`${detail.messageBinding.channelId} / ${detail.messageBinding.messageId}`
			)
		];
	}

	function buildDetailItems(
		challenge: ChallengeSummary | ChallengeDetail | null,
		detail: ChallengeDetail | null,
		linkedRound: { title?: string | null } | null
	): DetailItem[] {
		return [
			...buildOpenedItem(challenge),
			...buildAcceptedItem(challenge),
			...buildCompletedItem(detail),
			...buildHiddenItem(detail),
			...buildRoundItem(challenge, linkedRound),
			...buildMessageBindingItem(detail)
		];
	}

	const detailItems = $derived(buildDetailItems(challenge, detail, linkedRound));
</script>

<svelte:head>
	<title>Challenge Detail | {clubService.info?.name ?? 'Frolf Bot'}</title>
</svelte:head>

<main class="challenge-detail-page" data-testid="challenge-detail-page">
	<div class="page-shell">
		{#if detailRequestKey}
			{#key detailRequestKey}
				<ChallengeDetailLoader {challengeId} />
			{/key}
		{/if}

		<a class="back-link" href={resolve('/challenges')}>← Back to challenges</a>

		<header class="page-header">
			<div>
				<h1>Challenge Detail</h1>
				<p>Challenge ID: {challengeId || 'unknown'}</p>
			</div>
		</header>

		{#if roundRequested}
			<div class="page-banner" role="status">
				Round creation requested. The challenge will auto-link after the round is created.
			</div>
		{/if}

		{#if !auth.isAuthenticated || !identity}
			<p class="empty-state">Sign in to view this challenge.</p>
		{:else if challengeStore.detailLoading && !challenge}
			<p class="empty-state">Loading challenge…</p>
		{:else if challenge}
			<ChallengeCard {challenge} showDetailLink={false} />

			{#if detailItems.length > 0}
				<section class="detail-panel">
					<h2>Timeline</h2>
					<div class="detail-grid">
						{#each detailItems as item (item.label)}
							<div class="detail-item">
								<span class="detail-item__label">{item.label}</span>
								{#if item.href}
									<a class="detail-item__value detail-item__value--link" href={resolve(item.href)}>
										{item.value}
									</a>
								{:else}
									<span class="detail-item__value">{item.value}</span>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{:else}
			<p class="empty-state" data-testid="challenge-detail-empty">
				{challengeStore.detailError ?? 'Challenge not found.'}
			</p>
		{/if}
	</div>
</main>

<style>
	.challenge-detail-page {
		min-height: 100%;
		padding: 1rem 1rem 2rem;
	}

	.page-shell {
		max-width: 52rem;
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

	.back-link:hover,
	.detail-item__value--link:hover {
		text-decoration: underline;
	}

	.page-header h1,
	.detail-panel h2 {
		margin: 0;
		font-family: var(--font-display);
		color: var(--guild-text);
	}

	.page-header p,
	.empty-state {
		margin: 0.35rem 0 0;
		font-family: var(--font-secondary);
		color: var(--guild-text-secondary);
	}

	.page-banner,
	.detail-panel {
		border-radius: 0.9rem;
		border: 1px solid var(--guild-border);
		background: var(--guild-surface);
	}

	.page-banner {
		padding: 0.8rem 0.95rem;
		font-size: 0.9rem;
		color: var(--guild-primary);
		background: rgba(var(--guild-primary-rgb), 0.1);
	}

	.detail-panel {
		padding: 1rem;
	}

	.detail-grid {
		display: grid;
		gap: 0.85rem;
		margin-top: 0.85rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.detail-item__label {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--guild-text-secondary);
	}

	.detail-item__value {
		font-family: var(--font-secondary);
		color: var(--guild-text);
	}

	.detail-item__value--link {
		color: var(--guild-primary);
		text-decoration: none;
	}

	@media (min-width: 768px) {
		.challenge-detail-page {
			padding: 1.5rem 1rem 2.5rem;
		}

		.detail-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
