<script lang="ts">
	import ParticipantAvatar from './ParticipantAvatar.svelte';

	type Round = {
		id: string;
		guildId: string;
		title: string;
		location: string;
		description: string;
		startTime: string;
		state: 'scheduled' | 'started' | 'finalized' | 'cancelled';
		createdBy: string;
		eventMessageId: string;
		participants: Array<{
			userId: string;
			response: 'accepted' | 'declined' | 'tentative';
			score: number | null;
			tagNumber: number | null;
		}>;
	};

	type Props = {
		round: Round;
		onclick?: () => void;
	};

	let { round, onclick }: Props = $props();

	let statusColor = $derived(
		round.state === 'started'
			? 'bg-green-500'
			: round.state === 'scheduled'
				? 'bg-amber-500'
				: 'bg-slate-500'
	);

	let formattedDate = $derived(
		new Intl.DateTimeFormat('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(round.startTime))
	);

	let confirmedParticipants = $derived(
		round.participants.filter((p) => p.response === 'accepted')
	);

	let visibleParticipants = $derived(confirmedParticipants.slice(0, 5));
	let overflowCount = $derived(Math.max(0, confirmedParticipants.length - 5));
</script>

<button
	class="round-card"
	onclick={onclick}
	type="button"
	aria-label="View round: {round.title}"
>
	<div class="card-header">
		<div class="status-indicator">
			<div class="status-dot {statusColor}"></div>
		</div>
		<h3 class="round-title">{round.title}</h3>
	</div>

	<div class="card-details">
		{#if round.location}
			<p class="detail-item location">
				<span class="detail-icon">📍</span>
				{round.location}
			</p>
		{/if}

		<p class="detail-item date">
			<span class="detail-icon">📅</span>
			{formattedDate}
		</p>

		<p class="detail-item participants">
			<span class="detail-icon">👥</span>
			{confirmedParticipants.length}
			{confirmedParticipants.length === 1 ? 'player' : 'players'}
		</p>
	</div>

	{#if visibleParticipants.length > 0}
		<div class="participant-avatars">
			{#each visibleParticipants as participant (participant.userId)}
				<div class="avatar-wrapper">
					<ParticipantAvatar username={participant.userId} size={32} />
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
	}

	.round-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 116, 116, 0.15);
		border-color: var(--primary, #007474);
	}

	.round-card:focus-visible {
		outline: 2px solid var(--primary, #007474);
		outline-offset: 2px;
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.status-indicator {
		padding-top: 0.25rem;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.status-dot.bg-green-500 {
		background-color: #10b981;
		box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
	}

	.status-dot.bg-amber-500 {
		background-color: #f59e0b;
	}

	.status-dot.bg-slate-500 {
		background-color: #64748b;
	}

	.round-title {
		flex: 1;
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
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
</style>
