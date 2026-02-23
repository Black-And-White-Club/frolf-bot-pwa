<script lang="ts">
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import type { Round } from '$lib/stores/round.svelte';
	import ParticipantAvatar from './ParticipantAvatar.svelte';

	type Props = {
		round: Round;
		onclick?: () => void;
	};

	let { round, onclick }: Props = $props();

	let formattedDate = $derived(
		new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(round.startTime))
	);

	let confirmedParticipants = $derived(round.participants.filter((p) => p.response === 'accepted'));

	let visibleParticipants = $derived(confirmedParticipants.slice(0, 5));
	let overflowCount = $derived(Math.max(0, confirmedParticipants.length - 5));
</script>

<button
	class="round-card"
	{onclick}
	type="button"
	aria-label="View round: {round.title}"
	data-testid="round-card"
	data-round-id={round.id}
	data-state={round.state}
>
	<div class="card-header">
		<h3 class="round-title line-clamp-2">{round.title}</h3>
	</div>

	<div class="card-details">
		{#if round.location}
			<p class="detail-item location">
				<span class="detail-icon">📍</span>
				<span class="truncate">{round.location}</span>
			</p>
		{/if}

		<p class="detail-item date">
			<span class="detail-icon">📅</span>
			<span class="truncate">{formattedDate}</span>
		</p>
		<p class="detail-item participants">
			<span class="detail-icon">👥</span>
			{confirmedParticipants.length}
			{confirmedParticipants.length === 1 ? 'player' : 'players'}
		</p>
	</div>

	{#if round.state === 'finalized' && confirmedParticipants.length > 0}
		<!-- Scorecard Preview for Finalized Rounds -->
		{@const sortedScores = confirmedParticipants
			.filter((p) => typeof p.score === 'number')
			.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
			.slice(0, 3)}
		{#if sortedScores.length > 0}
			<div class="mt-2 pl-6">
				<div
					class="flex items-center gap-4 rounded-md border border-[var(--guild-border)] bg-[var(--guild-surface-elevated)] p-2 text-sm"
				>
					{#each sortedScores as p, i (`${p.userId || 'guest'}:${i}`)}
						<div class="flex items-center gap-2">
							<span class="font-secondary text-xs font-bold text-slate-400">#{i + 1}</span>
							<ParticipantAvatar
								userId={p.userId}
								username={userProfiles.getDisplayName(p.userId)}
								size={20}
							/>
							{#key p.score}
								<span
									class="font-secondary animate-scale-pulse inline-block font-bold text-[var(--guild-secondary)]"
									>{p.score}</span
								>
							{/key}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{:else if visibleParticipants.length > 0}
		<div class="participant-avatars">
			{#each visibleParticipants as participant, idx (`${participant.userId || 'guest'}:${idx}`)}
				<div class="avatar-wrapper">
					<ParticipantAvatar
						userId={participant.userId}
						username={userProfiles.getDisplayName(participant.userId)}
						size={32}
					/>
				</div>
			{/each}
			{#if overflowCount > 0}
				<div class="overflow-badge">+{overflowCount}</div>
			{/if}
		</div>
	{/if}
</button>

<style>
	.round-card {
		all: unset;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		box-sizing: border-box;

		/* Enable container queries */
		container-type: inline-size;
	}

	.round-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 116, 116, 0.15);
		border-color: var(--guild-primary, #007474);
	}

	.round-card:focus-visible {
		outline: 2px solid var(--guild-primary, #007474);
		outline-offset: 2px;
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.round-title {
		flex: 1;
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--guild-text, #e5e7eb);
		text-align: left;
		line-height: 1.4;
	}

	.card-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-left: 1.5rem;
	}

	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		font-size: 0.875rem;
		color: var(--guild-text-muted, #9ca3af);
		min-width: 0;
	}

	.detail-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.participant-avatars {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-left: 1.5rem;
		flex-wrap: wrap;
	}

	.avatar-wrapper {
		position: relative;
		margin-right: -8px;
	}

	.avatar-wrapper:first-child {
		margin-right: 0;
	}

	.overflow-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		color: var(--guild-text-muted, #9ca3af);
		font-size: 0.75rem;
		font-weight: 600;
	}

	@media (max-width: 640px) {
		.round-card {
			padding: 1rem;
		}

		.round-title {
			font-size: 1rem;
		}

		.detail-item {
			font-size: 0.8125rem;
		}
	}

	/* Container Query for Responsive Card Layout */
	@container (min-width: 440px) {
		.round-card {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 1.5rem;
			height: 100%; /* Ensure uniform height in grid */
		}

		.card-header {
			flex: 0 0 auto;
			max-width: 30%;
			min-width: 150px;
		}

		.card-details {
			flex: 1;
			flex-direction: row;
			justify-content: flex-start; /* Left-align details */
			align-items: center;
			flex-wrap: wrap;
			padding-left: 0;
			/* Add borders or separators if needed, for now just spacing */
			gap: 1.5rem;
		}

		.detail-item {
			width: auto;
		}

		.participant-avatars {
			padding-left: 0;
			justify-content: flex-end;
		}

		/* If we have scorecard preview */
		.mt-2 {
			margin-top: 0;
			padding-left: 0;
		}
	}
</style>
