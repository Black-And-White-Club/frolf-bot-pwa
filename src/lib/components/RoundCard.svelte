<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import RoundHeader from './round/RoundHeader.svelte';
	import RoundDetails from './round/RoundDetails.svelte';
	import ParticipantDisplay from './round/ParticipantDisplay.svelte';

	type ClickHandler = (payload: { roundId: string }) => void;

	export let round: Round;
	export let onRoundClick: ClickHandler | undefined = undefined;
	export let showStatus: boolean = true;
	export let compact: boolean = false;
	// Optional stable test id for the root card (recommended: `round-card-<round_id>`)
	export let dataTestId: string | undefined = undefined;

	function handleClick() {
		if (onRoundClick) {
			onRoundClick({ roundId: round.round_id });
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (onRoundClick) {
				onRoundClick({ roundId: round.round_id });
			}
		}
	}
</script>

<div
	class="bg-guild-surface rounded-xl border border-[var(--guild-border)] shadow-md hover:shadow-lg {compact
		? 'p-4'
		: 'p-6'} hover:border-primary-400 hover:shadow-primary-500/20 group relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02]"
	on:click={handleClick}
	on:keydown={handleKeydown}
	role="button"
	tabindex="0"
	data-testid={dataTestId}
>
	<!-- Subtle geometric pattern for modern classic personality -->
	<div
		class="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--guild-primary)_10px,var(--guild-primary)_11px)] opacity-[0.02] transition-opacity duration-300 group-hover:opacity-[0.05]"
	></div>

	<RoundHeader {round} {showStatus} testid={`round-title-${round.round_id}`} />
	<RoundDetails {round} {compact} testid={`round-details-${round.round_id}`} />
	<ParticipantDisplay {round} {compact} testid={`round-participants-${round.round_id}`} />
</div>
