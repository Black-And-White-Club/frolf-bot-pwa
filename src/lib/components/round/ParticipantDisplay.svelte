<script lang="ts">
	import type { Round, Participant } from '$lib/types/backend';
	import ParticipantAvatar from './ParticipantAvatar.svelte';

	type Props = {
		round: Round;
		participants?: Participant[];
		status?: string;
		par_total?: number;
		compact?: boolean;
		testid?: string;
	};

	let { round, participants, status, par_total, compact = false, testid }: Props = $props();

	let expanded = $state(false);

	const localStatus = $derived(status ?? round.status);
	const localParticipants = $derived(participants ?? round.participants ?? []);

	const sortedParticipants = $derived.by(() => {
		const parts = [...localParticipants];
		if (localStatus === 'completed') {
			parts.sort((a, b) => {
				const hasA = a.score !== undefined && a.score !== null;
				const hasB = b.score !== undefined && b.score !== null;
				if (hasA && hasB) return a.score! - b.score!;
				if (hasA) return -1;
				if (hasB) return 1;
				return 0;
			});
		}
		return parts;
	});

	const displayedParticipants = $derived(
		expanded ? sortedParticipants : sortedParticipants.slice(0, 4)
	);

	const hasMoreParticipants = $derived(sortedParticipants.length > 4);
	const remainingCount = $derived(sortedParticipants.length - 4);

	const scoredCount = $derived(
		localParticipants.filter((p) => p.score !== undefined && p.score !== null).length
	);

	function formatScore(score: number | undefined): string | null {
		if (score === undefined || score === null) return null;
		const parTotal = par_total ?? (round as any).par_total ?? (round as any).par;
		if (typeof parTotal === 'number') {
			const rel = score - parTotal;
			return rel === 0 ? 'E' : rel > 0 ? `+${rel}` : `${rel}`;
		}
		return `${score}`;
	}

	// Use CSS modifier classes for status badges so they match the .score-badge
	// visual style while allowing different color tokens per status.
	function getResponseBadgeClass(response: string | undefined): string {
		if (!response) return '';
		return `status-badge status-${response}`;
	}

	function getResponseText(response: string | undefined): string {
		return response ? response.charAt(0).toUpperCase() + response.slice(1) : '';
	}

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

{#if compact}
	<div class="participant-row compact" data-testid={testid}>
		<div class="flex min-w-0 items-center gap-2">
			<div class="flex items-center -space-x-1" role="group" aria-label="Participants">
				{#each localParticipants.slice(0, 3) as participant (participant.user_id || participant.username)}
					<div class="ring-guild-surface rounded-full ring-2">
						<ParticipantAvatar
							avatar_url={participant.avatar_url}
							username={participant.username}
							size={24}
							extraClasses="border-2"
						/>
					</div>
				{/each}

				{#if localParticipants.length > 3}
					<div class="avatar-overflow">
						<span class="text-xs font-bold text-white">
							+{localParticipants.length - 3}
						</span>
					</div>
				{/if}
			</div>

			<span class="text-guild-text truncate font-medium">
				{localParticipants.length}
				{localParticipants.length === 1 ? 'player' : 'players'}
			</span>
		</div>

		{#if scoredCount > 0}
			<div class="score-summary">{scoredCount} scored</div>
		{/if}
	</div>
{:else}
	<div class="participant-list" data-testid={testid}>
		{#each displayedParticipants as participant (participant.user_id || participant.username)}
			<div class="participant-row">
				<div class="participant-info">
					<ParticipantAvatar
						avatar_url={participant.avatar_url}
						username={participant.username}
						size={24}
						extraClasses="flex-shrink-0"
					/>
					<span class="participant-name" title={participant.username}>
						{participant.username}
					</span>
				</div>

				<div class="participant-status">
					{#if localStatus === 'scheduled'}
						{#if participant.response}
							<span class={getResponseBadgeClass(participant.response)}>
								{getResponseText(participant.response)}
							</span>
						{/if}
					{:else if formatScore(participant.score) !== null}
						<span class="score-badge">{formatScore(participant.score)}</span>
					{:else if localStatus === 'completed'}
						<span class="score-badge">DNP</span>
					{:else}
						<span class="score-badge" aria-hidden="true">-</span>
					{/if}
				</div>
			</div>
		{/each}

		{#if hasMoreParticipants}
			<div class="expand-button-container">
				<button class="expand-button" onclick={toggleExpanded} type="button">
					{expanded
						? 'Show less'
						: `+${remainingCount} more ${remainingCount === 1 ? 'player' : 'players'}`}
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.participant-row {
		display: grid;
		grid-template-columns: 1fr 7rem;
		gap: 1rem;
		align-items: center;
		font-size: 0.875rem;
	}

	.participant-row.compact {
		gap: 0.5rem;
	}

	.participant-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.participant-name {
		color: var(--guild-text);
		max-width: 10rem;
		min-width: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
		font-weight: 700;
	}

	.participant-status {
		text-align: right;
	}

	.score-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 0.375rem;
		background: rgba(var(--guild-primary-rgb, 0, 116, 116), 0.2);
		color: var(--guild-primary);
	}

	/* Status badges reuse score-badge sizing but map to different tokens */
	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.5rem;
		font-weight: 800;
		font-size: 0.75rem;
		border-radius: 0.375rem;
	}

	.status-yes {
		background: rgba(var(--guild-primary-rgb, 0, 116, 116), 0.1);
		color: var(--guild-primary);
	}

	/* 'maybe' uses the gold accent color used elsewhere in the app */
	.status-maybe {
		background: rgba(var(--guild-accent-rgb, 203, 165, 53), 0.12);
		color: var(--guild-accent);
	}

	.status-no {
		background: rgba(var(--guild-secondary-rgb, 139, 123, 184), 0.12);
		color: var(--guild-secondary);
	}

	.score-summary {
		color: var(--guild-primary);
		text-align: right;
		font-weight: 500;
	}

	.avatar-overflow {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 9999px;
		border: 2px solid var(--guild-border);
		background: var(--guild-secondary);
		box-shadow: 0 0 0 2px var(--guild-surface);
	}

	.participant-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.expand-button-container {
		display: flex;
		justify-content: center;
		padding-top: 0.25rem;
	}

	.expand-button {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--guild-primary);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}

	.expand-button:hover {
		text-decoration: underline;
	}

	@media (max-width: 639px) {
		.participant-row {
			grid-template-columns: 1fr 5rem;
		}

		.participant-name {
			max-width: 8rem;
		}
	}
</style>
