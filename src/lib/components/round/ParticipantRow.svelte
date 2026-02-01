<script lang="ts">
	import { userProfiles } from '$lib/stores/userProfiles.svelte';
	import ParticipantAvatar from './ParticipantAvatar.svelte';

	type Participant = {
		userId: string;
		response: 'accepted' | 'declined' | 'tentative';
		score: number | null;
		tagNumber: number | null;
		username?: string;
		avatar_url?: string;
	};

	type Props = {
		participant: Participant;
		position: number;
		showScore?: boolean;
		par?: number;
	};

	let { participant, position, showScore = true, par = 0 }: Props = $props();

	let scoreDisplay = $derived(() => {
		if (!showScore || participant.score === null) return null;

		const diff = participant.score - par;
		if (diff === 0) return 'E';
		return diff > 0 ? `+${diff}` : `${diff}`;
	});

	let positionStyle = $derived(
		position === 1
			? 'position-first'
			: position === 2
				? 'position-second'
				: position === 3
					? 'position-third'
					: 'position-default'
	);

	let scoreColorClass = $derived(() => {
		if (!showScore || participant.score === null) return '';
		const diff = participant.score - par;
		if (diff < 0) return 'score-under';
		if (diff > 0) return 'score-over';
		return 'score-even';
	});

	let positionBadge = $derived(
		position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}`
	);

	let displayName = $derived(userProfiles.getDisplayName(participant.userId));
	// keep response available on participant object; no local alias required
</script>

<div class="participant-row">
	<div class="position {positionStyle}">
		<span class="position-text">{positionBadge}</span>
	</div>

	<div class="participant-info">
		<ParticipantAvatar userId={participant.userId} avatar_url={participant.avatar_url} username={displayName} size={40} />
		<div class="participant-details">
			<span class="participant-name">{displayName}</span>
			{#if participant.tagNumber}
				<span class="tag-badge">#{participant.tagNumber}</span>
			{/if}
		</div>
	</div>

	{#if showScore && scoreDisplay()}
		<div class="score {scoreColorClass()}">
			<span class="score-value">{scoreDisplay()}</span>
			{#if participant.score !== null}
				<span class="score-raw">({participant.score})</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.participant-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.875rem 1rem;
		background: var(--guild-surface, #081212);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.participant-row:hover {
		background: var(--guild-surface-elevated, #0f1f1f);
		border-color: var(--primary, #007474);
	}

	.position {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.position-first {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: #1f2937;
	}

	.position-second {
		background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
		color: #1f2937;
	}

	.position-third {
		background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
		color: #1f2937;
	}

	.position-default {
		background: var(--guild-surface-elevated, #0f1f1f);
		color: var(--guild-text-muted, #9ca3af);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
	}

	.position-text {
		line-height: 1;
	}

	.participant-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.participant-details {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.participant-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--guild-text, #e5e7eb);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tag-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.125rem 0.5rem;
		background: var(--guild-surface-elevated, #0f1f1f);
		border: 1px solid var(--guild-border, rgba(0, 116, 116, 0.2));
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--guild-text-muted, #9ca3af);
	}

	.score {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.125rem;
		min-width: 4rem;
	}

	.score-value {
		font-size: 1.125rem;
		font-weight: 700;
		font-family: 'Space Grotesk', monospace;
	}

	.score-raw {
		font-size: 0.75rem;
		color: var(--guild-text-muted, #9ca3af);
		font-family: 'Space Grotesk', monospace;
	}

	.score-under .score-value {
		color: #10b981;
	}

	.score-over .score-value {
		color: #ef4444;
	}

	.score-even .score-value {
		color: var(--guild-text, #e5e7eb);
	}

	@media (max-width: 640px) {
		.participant-row {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.position {
			min-width: 2rem;
			height: 2rem;
			font-size: 0.8125rem;
		}

		.participant-name {
			font-size: 0.875rem;
		}

		.score-value {
			font-size: 1rem;
		}
	}
</style>
