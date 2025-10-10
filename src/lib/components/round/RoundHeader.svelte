<script lang="ts">
	import type { Round } from '$lib/types/backend';
	// calendar action moved into RoundDetails via AddToCalendarButton
	import StatusBadge from '$lib/components/general/StatusBadge.svelte';

	type Props = {
		round: Round;
		showStatus?: boolean;
		testid?: string;
	};

	let { round, showStatus = true, testid }: Props = $props();
</script>

<div class="round-header" data-testid={testid}>
	<h3
		class="min-w-0 truncate pr-1 text-lg font-semibold text-[var(--guild-text)] sm:pr-1"
		data-testid={`round-title-${round.round_id}`}
	>
		{round.title}
	</h3>

	<div class="round-header__controls">
		{#if false}
			<!-- calendar action intentionally moved to RoundDetails -->
		{/if}

		{#if showStatus}
			<div class="status-anchor">
				<StatusBadge
					status={round.status}
					count={undefined}
					showCount={false}
					testid={`status-${round.round_id}`}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.round-header {
		display: grid;
		grid-template-columns: 1fr var(--inner-controls-width, 6.25rem);
		gap: 0.5rem;
		align-items: center;
	}

	.round-header__controls {
		display: flex;
		width: var(--inner-controls-width, 6.25rem);
		gap: 0.5rem;
		overflow: visible;
		align-items: center;
		padding: 0; /* we'll position badge absolutely inside this area */
		justify-self: end; /* pin the control column to the right edge */
		position: relative;
	}

	.round-header__controls .status-anchor {
		position: absolute;
		right: var(--inner-controls-offset, 2rem);
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		min-width: 4rem;
		z-index: 2;
	}

	@media (min-width: 640px) {
		.round-header {
			grid-template-columns: 1fr var(--inner-controls-width, 6.25rem);
		}
	}

	/* Mobile: nudge the badge further right so inner-card badges align visually
	   a bit more to the right than desktop for improved touch spacing */
	@media (max-width: 639px) {
		.round-header__controls .status-anchor {
			right: var(
				--inner-controls-offset-header-mobile,
				calc(var(--inner-controls-offset, 2rem) + 1.25rem)
			);
		}
	}
</style>
