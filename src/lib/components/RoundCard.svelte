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

<div class="bg-guild-surface rounded-xl shadow-lg hover:shadow-xl border border-[var(--guild-border)] {compact ? 'p-4' : 'p-6'} cursor-pointer hover:border-[var(--guild-primary)]/30 transition-all duration-300 hover:scale-[1.02]" on:click={handleClick} on:keydown={handleKeydown} role="button" tabindex="0" data-testid={dataTestId}>
    <RoundHeader {round} {showStatus} testid={`round-title-${round.round_id}`} />
    <RoundDetails {round} {compact} testid={`round-details-${round.round_id}`} />
    <ParticipantDisplay {round} {compact} testid={`round-participants-${round.round_id}`} />
</div>
