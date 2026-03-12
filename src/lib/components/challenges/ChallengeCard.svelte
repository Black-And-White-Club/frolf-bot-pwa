<script lang="ts">
	import { resolve } from '$app/paths';
	import { auth } from '$lib/stores/auth.svelte';
	import { challengeStore, type ChallengeSummary } from '$lib/stores/challenges.svelte';
	import { roundService } from '$lib/stores/round.svelte';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';

	type Props = {
		challenge: ChallengeSummary;
		compact?: boolean;
		showDetailLink?: boolean;
	};

	let { challenge, compact = false, showDetailLink = true }: Props = $props();

	let selectedRoundId = $derived(challenge.linkedRound?.roundId ?? '');

	const isOpen = $derived(challenge.status === 'open');
	const isAccepted = $derived(challenge.status === 'accepted');
	const canRespond = $derived(isOpen && challengeStore.isCurrentUserDefender(challenge));
	const canWithdraw = $derived(
		(isOpen || isAccepted) && challengeStore.canManageChallenge(challenge)
	);
	const canHide = $derived(
		challenge.status !== 'hidden' && (auth.activeRole === 'admin' || auth.activeRole === 'editor')
	);
	const canManageRound = $derived(isAccepted && challengeStore.canManageChallenge(challenge));

	const reservedRoundIds = $derived(
		new Set(
			challengeStore.board
				.filter(
					(entry) =>
						entry.id !== challenge.id && entry.linkedRound?.isActive && entry.linkedRound.roundId
				)
				.map((entry) => entry.linkedRound!.roundId)
		)
	);

	const candidateRounds = $derived(
		roundService.upcomingRounds.filter(
			(round) =>
				round.id === challenge.linkedRound?.roundId || reservedRoundIds.has(round.id) === false
		)
	);

	const linkedRound = $derived(
		challenge.linkedRound?.roundId
			? (roundService.rounds.find((round) => round.id === challenge.linkedRound?.roundId) ?? null)
			: null
	);

	function participantName(side: 'challenger' | 'defender'): string {
		switch (side) {
			case 'challenger':
				return userProfiles.getDisplayName(
					challenge.challengerExternalId ?? challenge.challengerUserUuid
				);
			case 'defender':
				return userProfiles.getDisplayName(
					challenge.defenderExternalId ?? challenge.defenderUserUuid
				);
		}
	}

	function currentTag(side: 'challenger' | 'defender'): number | null {
		switch (side) {
			case 'challenger':
				return challenge.currentTags.challenger;
			case 'defender':
				return challenge.currentTags.defender;
		}
	}

	function originalTag(side: 'challenger' | 'defender'): number | null {
		switch (side) {
			case 'challenger':
				return challenge.originalTags.challenger;
			case 'defender':
				return challenge.originalTags.defender;
		}
	}

	function formatTimestamp(value: string | null): string {
		if (!value) {
			return '';
		}

		return new Date(value).toLocaleString([], {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function statusLabel(status: ChallengeSummary['status']): string {
		switch (status) {
			case 'open':
				return 'Open';
			case 'accepted':
				return 'Accepted';
			case 'declined':
				return 'Declined';
			case 'withdrawn':
				return 'Withdrawn';
			case 'expired':
				return 'Expired';
			case 'completed':
				return 'Completed';
			case 'hidden':
				return 'Hidden';
		}
	}

	async function handleAccept(): Promise<void> {
		await challengeStore.respondToChallenge(challenge.id, 'accept');
	}

	async function handleDecline(): Promise<void> {
		await challengeStore.respondToChallenge(challenge.id, 'decline');
	}

	async function handleWithdraw(): Promise<void> {
		await challengeStore.withdrawChallenge(challenge.id);
	}

	async function handleHide(): Promise<void> {
		await challengeStore.hideChallenge(challenge.id);
	}

	async function handleLinkRound(): Promise<void> {
		await challengeStore.linkRound(challenge.id, selectedRoundId);
	}

	async function handleUnlinkRound(): Promise<void> {
		await challengeStore.unlinkRound(challenge.id);
	}

	function roundHref(roundId: string): string {
		return `/rounds/${roundId}`;
	}

	function challengeHref(challengeId: string): string {
		return `/challenges/${challengeId}`;
	}

	function createRoundHref(challengeId: string): string {
		return `/rounds/create?challenge=${challengeId}`;
	}
</script>

<article
	class="challenge-card"
	class:compact
	data-testid={`challenge-card-${challenge.id}`}
	data-challenge-status={challenge.status}
>
	<header class="challenge-card__header">
		<div class="challenge-card__status">
			<span class={`status status--${challenge.status}`}>{statusLabel(challenge.status)}</span>
			{#if challenge.status === 'open' && challenge.openExpiresAt}
				<span class="challenge-card__deadline"
					>expires {formatTimestamp(challenge.openExpiresAt)}</span
				>
			{:else if challenge.status === 'accepted' && challenge.acceptedExpiresAt}
				<span class="challenge-card__deadline"
					>schedule by {formatTimestamp(challenge.acceptedExpiresAt)}</span
				>
			{/if}
		</div>
		{#if !compact}
			<span class="challenge-card__opened">opened {formatTimestamp(challenge.openedAt)}</span>
		{/if}
		{#if showDetailLink}
			<a class="challenge-card__detail-link" href={resolve(challengeHref(challenge.id))}>
				View challenge
			</a>
		{/if}
	</header>

	<div class="challenge-card__matchup">
		<div class="challenge-card__player">
			<span class="challenge-card__name">{participantName('challenger')}</span>
			<span class="challenge-card__tag">
				{#if currentTag('challenger') !== null}
					#{currentTag('challenger')}
				{:else}
					unranked
				{/if}
			</span>
		</div>
		<span class="challenge-card__verb">challenged</span>
		<div class="challenge-card__player">
			<span class="challenge-card__name">{participantName('defender')}</span>
			<span class="challenge-card__tag">
				{#if currentTag('defender') !== null}
					#{currentTag('defender')}
				{:else}
					unranked
				{/if}
			</span>
		</div>
	</div>

	<div class="challenge-card__meta">
		<span>
			Originally #{originalTag('challenger') ?? '–'} vs #{originalTag('defender') ?? '–'}
		</span>

		{#if challenge.linkedRound?.isActive}
			<span class="challenge-card__linked">
				Linked round:
				<a href={resolve(roundHref(challenge.linkedRound.roundId))}>
					{linkedRound?.title ?? `Round ${challenge.linkedRound.roundId.slice(0, 8)}`}
				</a>
			</span>
		{/if}
	</div>

	{#if canRespond || canWithdraw || canManageRound || canHide}
		<div class="challenge-card__actions">
			{#if canRespond}
				<button type="button" class="action action--primary" onclick={handleAccept}>Accept</button>
				<button type="button" class="action" onclick={handleDecline}>Decline</button>
			{/if}

			{#if canWithdraw}
				<button type="button" class="action" onclick={handleWithdraw}>Withdraw</button>
			{/if}

			{#if canManageRound && !challenge.linkedRound?.isActive}
				<div class="challenge-card__scheduler">
					<select bind:value={selectedRoundId}>
						<option value="">Link an existing round…</option>
						{#each candidateRounds as round (round.id)}
							<option value={round.id}>
								{round.title} • {formatTimestamp(round.startTime)}
							</option>
						{/each}
					</select>

					<button type="button" class="action" onclick={handleLinkRound}>Link Round</button>
					<a class="action action--link" href={resolve(createRoundHref(challenge.id))}>
						Create Round
					</a>
				</div>
			{:else if canManageRound && challenge.linkedRound?.isActive}
				<div class="challenge-card__scheduler">
					<button type="button" class="action" onclick={handleUnlinkRound}>Unlink Round</button>
					<a class="action action--link" href={resolve(createRoundHref(challenge.id))}>
						Replace Round
					</a>
				</div>
			{/if}

			{#if canHide}
				<button type="button" class="action action--danger" onclick={handleHide}>Hide</button>
			{/if}
		</div>
	{/if}
</article>

<style>
	.challenge-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--guild-border);
		border-radius: 0.9rem;
		background:
			linear-gradient(180deg, rgba(var(--guild-primary-rgb), 0.06), transparent 55%),
			var(--guild-surface-elevated, var(--guild-surface));
	}

	.challenge-card.compact {
		padding: 0.85rem;
	}

	.challenge-card__header,
	.challenge-card__status,
	.challenge-card__meta,
	.challenge-card__actions,
	.challenge-card__scheduler {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		align-items: center;
	}

	.challenge-card__header {
		justify-content: space-between;
	}

	.challenge-card__opened,
	.challenge-card__deadline,
	.challenge-card__meta {
		font-size: 0.8rem;
		color: var(--guild-text-secondary);
	}

	.challenge-card__detail-link {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--guild-primary);
		text-decoration: none;
	}

	.challenge-card__detail-link:hover {
		text-decoration: underline;
	}

	.challenge-card__matchup {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
	}

	.challenge-card__player {
		display: inline-flex;
		align-items: baseline;
		gap: 0.45rem;
		font-family: var(--font-secondary);
	}

	.challenge-card__name {
		font-weight: 600;
		color: var(--guild-text);
	}

	.challenge-card__tag,
	.challenge-card__verb {
		font-size: 0.85rem;
		color: var(--guild-text-secondary);
	}

	.challenge-card__linked a,
	.action--link {
		color: var(--guild-primary);
		text-decoration: none;
	}

	.challenge-card__linked a:hover,
	.action--link:hover {
		text-decoration: underline;
	}

	.status {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: rgba(255, 255, 255, 0.08);
		color: var(--guild-text);
	}

	.status--open {
		background: rgba(16, 185, 129, 0.18);
		color: #0f766e;
	}

	.status--accepted {
		background: rgba(var(--guild-primary-rgb), 0.18);
		color: var(--guild-primary);
	}

	.action {
		border: 1px solid var(--guild-border);
		background: var(--guild-surface);
		color: var(--guild-text);
		border-radius: 999px;
		padding: 0.45rem 0.8rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.action:hover {
		border-color: rgba(var(--guild-primary-rgb), 0.5);
	}

	.action--primary {
		background: rgba(var(--guild-primary-rgb), 0.14);
		border-color: rgba(var(--guild-primary-rgb), 0.45);
		color: var(--guild-primary);
	}

	.action--danger {
		color: #b91c1c;
	}

	select {
		min-width: 14rem;
		max-width: 100%;
		border-radius: 0.75rem;
		border: 1px solid var(--guild-border);
		background: var(--guild-surface);
		color: var(--guild-text);
		padding: 0.45rem 0.65rem;
	}

	@media (max-width: 640px) {
		.challenge-card__header {
			flex-direction: column;
			align-items: flex-start;
		}

		.challenge-card__scheduler {
			flex-direction: column;
			align-items: stretch;
		}

		select {
			min-width: 0;
			width: 100%;
		}
	}
</style>
