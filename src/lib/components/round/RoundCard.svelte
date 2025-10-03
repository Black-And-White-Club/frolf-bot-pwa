<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import RoundHeader from './RoundHeader.svelte';
	import RoundDetails from './RoundDetails.svelte';
	import ParticipantDisplay from './ParticipantDisplay.svelte';

	type ClickHandler = (payload: { roundId: string }) => void;

	export let round: Round;
	export let onRoundClick: ClickHandler | undefined = undefined;
	export let showStatus: boolean = true;
	export let compact: boolean = false;
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

<div class="bg-guild-surface rounded-xl shadow-lg hover:shadow-xl border border-[var(--guild-border)] {compact ? 'p-4' : 'p-6'} cursor-pointer transition-all duration-300 hover:scale-[1.02]" on:click={handleClick} on:keydown={handleKeydown} role="button" tabindex="0" data-testid={dataTestId}>
	<RoundHeader {round} {showStatus} />
	<RoundDetails {round} {compact} />
	<ParticipantDisplay {round} {compact} />
</div>
