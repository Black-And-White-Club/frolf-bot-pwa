<script lang="ts">
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import ParticipantAvatar from '../round/ParticipantAvatar.svelte';

	type Participant = {
		userId: string;
		rawName?: string;
		username?: string;
		avatar_url?: string;
		scores?: number[];
		score: number | null;
	};

	type Round = {
		id: string;
		state: 'scheduled' | 'started' | 'finalized' | 'cancelled';
		holes?: number;
		parValues?: number[];
		currentHole?: number;
		participants: Participant[];
	};

	type Props = {
		round: Round;
	};

	let { round }: Props = $props();

	let holes = $derived(Array.from({ length: round.holes ?? 18 }, (_, i) => i + 1));

	let parValues = $derived(round.parValues ?? holes.map(() => 3));

	let participants = $derived(
		round.participants
			.filter((p) => p.score !== null)
			.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
	);

	function getScoreColor(score: number | undefined, par: number): string {
		if (score === undefined) return '';
		const diff = score - par;
		if (diff < 0) return 'score-birdie';
		if (diff > 0) return 'score-bogey';
		return 'score-par';
	}

	function getParticipantTotal(participant: Participant): number | null {
		if (!participant.scores || participant.scores.length === 0) {
			return participant.score;
		}
		const sum = participant.scores.reduce((acc, s) => acc + (s ?? 0), 0);
		return sum || participant.score;
	}

	function participantName(participant: Participant): string {
		if (participant.userId) {
			return userProfiles.getDisplayName(participant.userId);
		}
		return participant.rawName || participant.username || 'Guest';
	}

	let currentHole = $derived(round.currentHole ?? 0);
</script>

<div class="score-grid-container">
	<div class="score-grid-wrapper">
		<table class="score-grid">
			<thead>
				<tr>
					<th class="player-column sticky-column">Player</th>
					{#each holes as hole (hole)}
						<th class="hole-column" class:current-hole={hole === currentHole}>
							{hole}
						</th>
					{/each}
					<th class="total-column sticky-total">Total</th>
				</tr>
			</thead>
			<tbody>
				{#each participants as participant, idx (`${participant.userId || 'guest'}:${idx}`)}
					<tr class="participant-row-grid">
						<td class="player-cell sticky-column">
							<div class="player-info">
									<ParticipantAvatar
										userId={participant.userId}
										avatar_url={participant.avatar_url}
										username={participantName(participant)}
										size={24}
									/>
									<span class="player-name">
										{participantName(participant)}
									</span>
							</div>
						</td>
						{#each holes as hole, idx (hole)}
							<td
								class="score-cell {getScoreColor(participant.scores?.[idx], parValues[idx])}"
								class:current-hole={hole === currentHole}
							>
								{#if participant.scores?.[idx] !== undefined}
									{participant.scores[idx]}
								{:else}
									-
								{/if}
							</td>
						{/each}
						<td class="total-cell sticky-total">
							{getParticipantTotal(participant) ?? '-'}
						</td>
					</tr>
				{/each}
				<tr class="par-row">
					<td class="player-cell sticky-column">
						<span class="par-label">Par</span>
					</td>
					{#each parValues as par, idx (idx)}
						<td class="score-cell" class:current-hole={holes[idx] === currentHole}>
							{par}
						</td>
					{/each}
					<td class="total-cell sticky-total">
						{parValues.reduce((acc, p) => acc + p, 0)}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>

<style>
	.score-grid-container {
		width: 100%;
		overflow-x: auto;
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.5rem;
		background: var(--guild-surface, #081212);
	}

	.score-grid-wrapper {
		min-width: 100%;
		overflow-x: auto;
	}

	.score-grid {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-family: 'Space Grotesk', monospace;
	}

	thead {
		background: var(--guild-surface-elevated, #0f1f1f);
		position: sticky;
		top: 0;
		z-index: 2;
	}

	th {
		padding: 0.75rem 0.5rem;
		text-align: center;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--guild-text-muted, #9ca3af);
		border-bottom: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
	}

	.player-column {
		text-align: left;
		padding-left: 1rem;
		min-width: 150px;
	}

	.hole-column {
		min-width: 40px;
		width: 40px;
	}

	.total-column {
		min-width: 60px;
		font-weight: 700;
		color: var(--guild-text, #e5e7eb);
	}

	.sticky-column {
		position: sticky;
		left: 0;
		background: var(--guild-surface, #081212);
		z-index: 1;
	}

	.sticky-total {
		position: sticky;
		right: 0;
		background: var(--guild-surface-elevated, #0f1f1f);
		z-index: 1;
	}

	.participant-row-grid {
		border-bottom: 1px solid var(--guild-border, rgba(0, 116, 116, 0.1));
	}

	.participant-row-grid:hover {
		background: var(--guild-surface-elevated, #0f1f1f);
	}

	.player-cell {
		padding: 0.75rem 1rem;
		text-align: left;
	}

	.player-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.player-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--guild-text, #e5e7eb);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.score-cell {
		padding: 0.75rem 0.5rem;
		text-align: center;
		font-size: 0.875rem;
		color: var(--guild-text, #e5e7eb);
		transition: background-color 0.2s ease;
	}

	.score-birdie {
		color: #10b981;
		font-weight: 600;
	}

	.score-bogey {
		color: #ef4444;
		font-weight: 600;
	}

	.score-par {
		color: var(--guild-text, #e5e7eb);
	}

	.current-hole {
		background: rgba(0, 116, 116, 0.15);
		border-left: 2px solid var(--primary, #007474);
		border-right: 2px solid var(--primary, #007474);
	}

	.total-cell {
		padding: 0.75rem 1rem;
		text-align: center;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--guild-text, #e5e7eb);
	}

	.par-row {
		background: var(--guild-surface-elevated, #0f1f1f);
		border-top: 2px solid var(--guild-border, rgba(0, 116, 116, 0.3));
	}

	.par-row .player-cell {
		font-weight: 600;
	}

	.par-label {
		color: var(--guild-text-muted, #9ca3af);
		font-size: 0.875rem;
		font-weight: 600;
	}

	@media (max-width: 640px) {
		.player-column {
			min-width: 120px;
		}

		.hole-column {
			min-width: 36px;
			width: 36px;
		}

		th,
		.score-cell {
			padding: 0.5rem 0.25rem;
			font-size: 0.75rem;
		}

		.player-cell {
			padding: 0.5rem;
		}

		.player-name {
			font-size: 0.8125rem;
		}
	}
</style>
