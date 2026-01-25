<script lang="ts">
	import { roundService } from '$lib/stores/round.svelte';
	import ParticipantRow from './ParticipantRow.svelte';
	import ScoreGrid from '../score/ScoreGrid.svelte';

	type Props = {
		roundId: string;
	};

	let { roundId }: Props = $props();

	let round = $derived(roundService.rounds.find((r) => r.id === roundId));

	let confirmedParticipants = $derived(
		round?.participants
			.filter((p) => p.response === 'accepted')
			.sort((a, b) => {
				const scoreA = a.score ?? Number.MAX_SAFE_INTEGER;
				const scoreB = b.score ?? Number.MAX_SAFE_INTEGER;
				return scoreA - scoreB;
			}) ?? []
	);

	let statusBadge = $derived(() => {
		if (!round) return { text: 'Unknown', class: 'status-unknown' };

		switch (round.state) {
			case 'started':
				return { text: 'Live Now', class: 'status-live' };
			case 'scheduled':
				return { text: 'Upcoming', class: 'status-upcoming' };
			case 'finalized':
				return { text: 'Complete', class: 'status-complete' };
			case 'cancelled':
				return { text: 'Cancelled', class: 'status-cancelled' };
			default:
				return { text: 'Unknown', class: 'status-unknown' };
		}
	});

	let formattedDate = $derived(() => {
		if (!round) return '';
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(round.startTime));
	});

	let leader = $derived(() => {
		if (confirmedParticipants.length === 0) return null;
		return confirmedParticipants[0];
	});

	let holesCompleted = $derived(() => {
		if (!round || round.state === 'scheduled') return null;
		const totalHoles = round.holes ?? 18;
		const current = round.currentHole ?? 0;
		return { current, total: totalHoles };
	});

	let showScoreGrid = $derived(
		round?.state === 'started' || round?.state === 'finalized'
	);

	let roundPar = $derived(() => {
		if (!round?.parValues) return (round?.holes ?? 18) * 3;
		return round.parValues.reduce((acc, p) => acc + p, 0);
	});
</script>

{#if !round}
	<div class="empty-state">
		<p class="empty-text">Round not found</p>
	</div>
{:else}
	<div class="round-detail">
		<!-- Header Section -->
		<header class="detail-header">
			<div class="header-top">
				<h1 class="round-title">{round.title}</h1>
				<div class="status-badge {statusBadge().class}">
					{statusBadge().text}
				</div>
			</div>

			<div class="header-meta">
				{#if round.location}
					<div class="meta-item">
						<span class="meta-icon">📍</span>
						<span class="meta-text">{round.location}</span>
					</div>
				{/if}

				<div class="meta-item">
					<span class="meta-icon">📅</span>
					<span class="meta-text">{formattedDate()}</span>
				</div>
			</div>

			{#if round.description}
				<p class="round-description">{round.description}</p>
			{/if}
		</header>

		<!-- Stats Bar (for started/finalized rounds) -->
		{#if round.state === 'started' || round.state === 'finalized'}
			<div class="stats-bar">
				{#if holesCompleted()}
					<div class="stat-item">
						<span class="stat-label">Progress</span>
						<span class="stat-value">
							Hole {holesCompleted()?.current} of {holesCompleted()?.total}
						</span>
					</div>
				{/if}

				<div class="stat-item">
					<span class="stat-label">Players</span>
					<span class="stat-value">{confirmedParticipants.length}</span>
				</div>

				{#if leader() && leader()?.score !== null}
					<div class="stat-item">
						<span class="stat-label">Leader</span>
						<span class="stat-value">
							{leader()?.username || leader()?.userId}
							<span class="leader-score">
								{(() => {
									const diff = (leader()?.score ?? 0) - roundPar();
									if (diff === 0) return 'E';
									return diff > 0 ? `+${diff}` : `${diff}`;
								})()}
							</span>
						</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Participant List -->
		<section class="participants-section">
			<h2 class="section-title">
				{round.state === 'scheduled' ? 'Registered Players' : 'Leaderboard'}
			</h2>
			<div class="participants-list">
				{#if confirmedParticipants.length > 0}
					{#each confirmedParticipants as participant, idx (participant.userId)}
						<ParticipantRow
							{participant}
							position={idx + 1}
							showScore={round.state !== 'scheduled'}
							par={roundPar()}
						/>
					{/each}
				{:else}
					<div class="empty-participants">
						<p class="empty-text">No confirmed participants yet</p>
					</div>
				{/if}
			</div>
		</section>

		<!-- Score Grid (for started/finalized rounds) -->
		{#if showScoreGrid}
			<section class="score-section">
				<h2 class="section-title">Scorecard</h2>
				<ScoreGrid {round} />
			</section>
		{/if}
	</div>
{/if}

<style>
	.round-detail {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	.detail-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
	}

	.header-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.round-title {
		font-family: 'Fraunces', serif;
		font-size: 2rem;
		font-weight: 700;
		color: var(--guild-text, #e5e7eb);
		margin: 0;
		line-height: 1.2;
	}

	.status-badge {
		padding: 0.375rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.status-live {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
		border: 1px solid rgba(16, 185, 129, 0.3);
		box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
	}

	.status-upcoming {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.3);
	}

	.status-complete {
		background: rgba(100, 116, 139, 0.15);
		color: #94a3b8;
		border: 1px solid rgba(100, 116, 139, 0.3);
	}

	.status-cancelled {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.status-unknown {
		background: rgba(156, 163, 175, 0.15);
		color: #9ca3af;
		border: 1px solid rgba(156, 163, 175, 0.3);
	}

	.header-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		color: var(--guild-text-muted, #9ca3af);
	}

	.meta-icon {
		font-size: 1.125rem;
		line-height: 1;
	}

	.round-description {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--guild-text-muted, #9ca3af);
		line-height: 1.6;
	}

	.stats-bar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		padding: 1.25rem;
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--guild-text-muted, #9ca3af);
	}

	.stat-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--guild-text, #e5e7eb);
		font-family: 'Space Grotesk', monospace;
	}

	.leader-score {
		margin-left: 0.5rem;
		font-weight: 700;
		color: var(--primary, #007474);
	}

	.participants-section,
	.score-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--guild-text, #e5e7eb);
		margin: 0;
		padding: 0 0.5rem;
	}

	.participants-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-participants,
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 150px;
		padding: 2rem;
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.75rem;
	}

	.empty-text {
		color: var(--guild-text-muted, #9ca3af);
		font-size: 0.875rem;
		margin: 0;
	}

	@media (max-width: 640px) {
		.round-title {
			font-size: 1.5rem;
		}

		.detail-header {
			padding: 1rem;
		}

		.stats-bar {
			padding: 1rem;
			grid-template-columns: 1fr;
		}

		.header-meta {
			flex-direction: column;
			gap: 0.75rem;
		}
	}
</style>
