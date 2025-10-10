<script lang="ts">
	import type { Round, Participant } from '$lib/types/backend';
	import ParticipantAvatar from './ParticipantAvatar.svelte';
	import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '$lib/utils/unsplash';

	type Props = {
		round: Round;
		participants?: Participant[];
		status?: string;
		par_total?: number;
		compact?: boolean;
		testid?: string;
	};

	let { round, participants, status, par_total, compact = false, testid }: Props = $props();

	// State using Svelte 5 runes
	let expanded = $state(false);

	// Computed values using $derived
	const localStatus = $derived(status ?? round.status);
	const localParticipants = $derived(participants ?? round.participants ?? []);

	const sortedParticipants = $derived.by(() => {
		const parts = [...localParticipants];

		if (localStatus === 'completed') {
			parts.sort((a, b) => {
				const scoreA = a.score;
				const scoreB = b.score;
				const hasA = scoreA !== undefined && scoreA !== null;
				const hasB = scoreB !== undefined && scoreB !== null;

				if (hasA && hasB) return scoreA - scoreB;
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

	// Format score relative to par
	function formatScore(score: number | undefined): string | null {
		if (score === undefined || score === null) return null;

		const parTotal = par_total ?? (round as any).par_total ?? (round as any).par;

		if (typeof parTotal === 'number') {
			const relative = score - parTotal;
			if (relative === 0) return 'E';
			return relative > 0 ? `+${relative}` : `${relative}`;
		}

		return `${score}`;
	}

	// Get badge styling based on response
	function getResponseBadgeClass(response: string | undefined): string {
		if (!response) return '';

		const baseClass =
			'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold transition-colors';

		switch (response) {
			case 'yes':
				return `${baseClass} bg-guild-primary/10 text-guild-primary`;
			case 'maybe':
				return `${baseClass} bg-guild-accent/10 text-guild-accent`;
			case 'no':
				return `${baseClass} bg-guild-secondary/10 text-guild-secondary`;
			default:
				return baseClass;
		}
	}

	// Get response text
	function getResponseText(response: string | undefined): string {
		if (!response) return '';
		return response.charAt(0).toUpperCase() + response.slice(1);
	}

	// Toggle expanded state
	function toggleExpanded(): void {
		expanded = !expanded;
	}

	// Keyboard handler for expand button
	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleExpanded();
		}
	}
</script>

{#if compact}
	<!-- Compact view: stacked avatars with count -->
	<div
		class="participant-row grid items-center gap-2 text-sm"
		style="grid-template-columns: 1fr minmax(4rem, var(--inner-controls-width));"
		data-testid={testid}
	>
		<div class="flex min-w-0 items-center gap-2">
			<div class="flex items-center -space-x-1" role="group" aria-label="Participants">
				{#each localParticipants.slice(0, 3) as participant}
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
					<div
						class="participant-avatar border-guild-border bg-guild-secondary ring-guild-surface flex h-6 w-6 items-center justify-center rounded-full border-2 ring-2"
						aria-label="{localParticipants.length - 3} more participants"
					>
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
			<div class="text-guild-primary pr-inner-controls text-right font-medium">
				{scoredCount} scored
			</div>
		{/if}
	</div>
{:else}
	<!-- Full view: individual participant rows -->
	<div class="space-y-2" data-testid={testid}>
		{#each displayedParticipants as participant (participant.user_id || participant.username)}
			<div
				class="participant-row grid items-center text-sm"
				style="grid-template-columns: 1fr minmax(4rem, var(--inner-controls-width)); gap: 1.5rem;"
			>
				<!-- Left: Avatar and name -->
				<div class="flex min-w-0 items-center gap-2">
					<ParticipantAvatar
						avatar_url={participant.avatar_url}
						username={participant.username}
						size={24}
						extraClasses="flex-shrink-0"
					/>
					<span
						class="text-guild-text max-w-[10rem] min-w-0 flex-1 truncate text-left md:max-w-[14rem]"
						title={participant.username}
					>
						{participant.username}
					</span>
				</div>

				<!-- Right: Status/Score -->
				<div class="pr-inner-controls text-right">
					{#if localStatus === 'scheduled'}
						{#if participant.response}
							<span class={getResponseBadgeClass(participant.response)}>
								{getResponseText(participant.response)}
							</span>
						{/if}
					{:else if formatScore(participant.score) !== null}
						<span
							class="bg-guild-primary/20 text-guild-primary inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold"
						>
							{formatScore(participant.score)}
						</span>
					{:else if localStatus === 'completed'}
						<span
							class="bg-guild-primary/20 text-guild-primary inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold"
						>
							DNP
						</span>
					{:else}
						<!-- Active round, no score yet -->
						<span
							class="bg-guild-primary/20 text-guild-primary inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold"
							aria-hidden="true"
						>
							-
						</span>
					{/if}
				</div>
			</div>
		{/each}

		<!-- Expand/Collapse button -->
		{#if hasMoreParticipants}
			<div class="flex justify-center pt-1">
				<button
					class="link-like focus-visible:outline-guild-primary tap-highlight-none text-xs font-medium"
					onclick={toggleExpanded}
					onkeydown={handleKeyDown}
					aria-expanded={expanded}
					aria-controls="participant-list"
					type="button"
				>
					{#if !expanded}
						+{remainingCount} more {remainingCount === 1 ? 'player' : 'players'}
					{:else}
						Show less
					{/if}
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Mobile: Ensure right-hand controls align properly */
	@media (max-width: 639px) {
		:global(.participant-row) {
			grid-template-columns: 1fr minmax(4rem, var(--inner-controls-width)) !important;
		}

		:global(.participant-row > div:last-child) {
			justify-self: end;
			text-align: right;
		}
	}

	/* Ensure smooth transitions for expand/collapse */
	@media (prefers-reduced-motion: no-preference) {
		.space-y-2 > * {
			animation: slideDown 200ms ease-out;
		}
	}
</style>
