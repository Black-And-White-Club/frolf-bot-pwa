<script lang="ts">
	import type { Round, Participant } from '$lib/types/backend';
	import ParticipantAvatar from './ParticipantAvatar.svelte';

	export let round: Round;
	export let participants: Participant[] | undefined = undefined; // optional explicit participants list
	export let status: string | undefined = undefined; // optional explicit status
	export let par_total: number | undefined = undefined; // optional explicit par_total or par
	export let compact: boolean = false;
	export let testid: string | undefined = undefined;

	let expanded = false;

	function toggleExpanded() {
		expanded = !expanded;
	}

	// helpers for responsive avatars (used only for srcset decision)
	import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '$lib/utils/unsplash';

	function formatScore(s: number | undefined) {
		if (s === undefined || s === null) return null;
		// Prefer explicit par_total prop, else fall back to round props
		const parTotal = par_total ?? (round as any).par_total ?? (round as any).par;
		if (typeof parTotal === 'number') {
			const rel = s - parTotal;
			if (rel === 0) return 'E';
			return rel > 0 ? `+${rel}` : `${rel}`;
		}
		// Fallback: show raw strokes (no leading +) when par isn't available
		return `${s}`;
	}

	// compute participants to display; for completed rounds sort by numeric score (lower better)
	function participantsToShow() {
		// use explicit participants when provided, otherwise use round.participants
		const src = participants ?? round.participants ?? [];
		const parts = src.slice();
		const localStatus = status ?? round.status;
		if (localStatus === 'completed') {
			parts.sort((a, b) => {
				const ax = a.score;
				const bx = b.score;
				const aHas = ax !== undefined && ax !== null;
				const bHas = bx !== undefined && bx !== null;
				if (aHas && bHas) return ax - bx; // lower score first
				if (aHas) return -1;
				if (bHas) return 1;
				return 0;
			});
		}
		return parts;
	}
</script>

{#if !compact}
	<div class="space-y-2" data-testid={testid}>
		{#each expanded ? participantsToShow() : participantsToShow().slice(0, 4) as participant}
			<div class="participant-row relative flex items-center text-sm">
				<div class="flex min-w-0 items-center space-x-2 pr-56 md:pr-20">
					<ParticipantAvatar
						avatar_url={participant.avatar_url}
						username={participant.username}
						size={24}
						extraClasses="flex-shrink-0"
					/>
					<span
						class="max-w-[10rem] min-w-0 flex-1 truncate text-left text-[var(--guild-text)] md:max-w-[14rem]"
						>{participant.username}</span
					>

					<!-- Responses moved to the right column for scheduled rounds -->
				</div>
				<div
					class="absolute text-right md:static md:ml-1 md:w-20"
					style="right: 0; top: 50%; transform: translateY(-50%);"
				>
					{#if (status ?? round.status) === 'scheduled'}
						{#if participant.response}
							<span
								class={`rounded px-2 py-1 text-xs font-semibold ${participant.response === 'yes' ? 'bg-[var(--guild-primary)]/10 text-[var(--guild-primary)]' : participant.response === 'maybe' ? 'bg-[var(--guild-accent)]/10 text-[var(--guild-accent)]' : 'bg-[var(--guild-secondary)]/10 text-[var(--guild-secondary)]'}`}
							>
								{participant.response === 'yes'
									? 'Yes'
									: participant.response === 'maybe'
										? 'Maybe'
										: participant.response === 'no'
											? 'No'
											: ''}
							</span>
						{/if}
					{:else if formatScore(participant.score) !== null}
						<span
							class="rounded bg-[var(--guild-primary)]/20 px-2 py-1 text-xs font-semibold text-[var(--guild-primary)]"
							>{formatScore(participant.score)}</span
						>
					{:else if (status ?? round.status) === 'completed'}
						<span
							class="rounded bg-[var(--guild-primary)]/20 px-2 py-1 text-xs font-semibold text-[var(--guild-primary)]"
							>DNP</span
						>
					{:else}
						<!-- active/no score placeholder -->
						<span
							class="rounded bg-[var(--guild-primary)]/20 px-2 py-1 text-xs font-semibold text-[var(--guild-primary)]"
							aria-hidden="true">-</span
						>
					{/if}
				</div>
			</div>
		{/each}
		{#if participantsToShow().length > 4}
			<div class="text-center text-xs font-medium text-[var(--guild-text)]">
				<button class="underline" on:click={toggleExpanded} aria-expanded={expanded}>
					{#if !expanded}
						+{participantsToShow().length - 4} more players
					{:else}
						Show less
					{/if}
				</button>
			</div>
		{/if}
	</div>
{:else}
	<div class="participant-row relative flex items-center text-sm">
		<div class="flex min-w-0 items-center space-x-2 pr-44 md:pr-20">
			<div class="flex items-center -space-x-1">
				{#each (participants ?? round.participants ?? []).slice(0, 3) as participant}
					<ParticipantAvatar
						avatar_url={participant.avatar_url}
						username={participant.username}
						size={24}
						extraClasses="border-2"
					/>
				{/each}
				{#if (participants ?? round.participants ?? []).length > 3}
					<div
						class="participant-avatar participant-avatar--secondary flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--guild-border)] bg-[var(--guild-secondary)]"
					>
						<span class="text-xs font-bold text-[var(--guild-text)]"
							>+{(round.participants ?? []).length - 3}</span
						>
					</div>
				{/if}
			</div>
			<span class="ml-2 truncate font-medium text-[var(--guild-text)]"
				>{(participants ?? round.participants ?? []).length} players</span
			>
		</div>
		{#if (participants ?? round.participants ?? []).some((p) => p.score !== undefined && p.score !== null)}
			<span
				class="absolute font-medium text-[var(--guild-primary)] md:static"
				style="right: 0; top: 50%; transform: translateY(-50%);"
			>
				{(participants ?? round.participants ?? []).filter(
					(p) => p.score !== undefined && p.score !== null
				).length}
				scored
			</span>
		{/if}
	</div>
{/if}
