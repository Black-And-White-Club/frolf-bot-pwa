<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import StatusBadge from '$lib/components/general/StatusBadge.svelte';

	type Props = {
		round: Round;
		showStatus?: boolean;
		testid?: string;
		rootRef?: HTMLElement | null;
	};

	let { round, showStatus = true, testid, rootRef = null }: Props = $props();
</script>

<div class="round-header" data-testid={testid} bind:this={rootRef}>
	<h3 class="round-title">
		{round.title}
	</h3>

	{#if showStatus}
		<div class="status-column">
			<StatusBadge status={round.status} showCount={false} testid={`status-${round.round_id}`} />
		</div>
	{/if}
</div>

<style>
	.round-header {
		display: grid;
		/* Use the shared control width token so headers and cards align.
		   Use minmax(0, 1fr) for the title column so it can shrink properly
		   inside a grid (prevents overflow/clipping on small viewports). */
		grid-template-columns: minmax(0, 1fr) minmax(4rem, var(--inner-controls-width, 7rem));
		align-items: start;
		gap: 1rem;
		width: 100%;
	}

	.round-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--guild-text);
		margin: 0;
		min-width: 0; /* Allow text to shrink/truncate if needed */
		/* single-line truncation by default; short titles will stay on one line
		   and long titles will ellipsis. Padding on small screens prevents
		   the status badge from overlapping the text. */
		line-height: 1.25;
		/* reserve a small right gap so the status badge doesn't visually
		   collide with the title. Avoid forcing a max-inline-size here because
		   it can over-constrain the title area on narrow devices. */
		box-sizing: border-box;
		padding-right: 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		/* keep normal word wrapping for wrapped contexts but avoid breaking letters */
		word-break: normal;
		overflow-wrap: normal;
	}

	.status-column {
		display: flex;
		/* Right-align badges so their right edge lines up with card controls */
		justify-content: flex-end;
		align-items: center;
		padding-right: var(--inner-controls-offset, 1rem);
		box-sizing: border-box;
	}

	@media (max-width: 640px) {
		.round-header {
			/* On mobile let the control column size to its content so the badge
			   never gets truncated and the title only uses the remaining space */
			grid-template-columns: 1fr max-content;
			gap: 0rem;
		}

		.round-title {
			/* ensure title stays in the first grid column on mobile */
			grid-column: 1 / 2;
			/* still defensive: small right padding only */
			padding-right: 0rem;
		}

		.status-column {
			/* badge column auto-sizes (max-content), keep it right-aligned */
			grid-column: 2 / 3;
			justify-self: end;
		}
	}

	/* Very small screens: reduce title to 1 line and bring controls a bit closer */
	@media (max-width: 420px) {
		.round-header {
			/* on very small screens also let the badge size itself; this avoids
			   hard-coding a width and prevents overlap when the badge label grows */
			grid-template-columns: 1fr max-content;
			gap: 0.5rem;
		}

		.round-title {
			/* Keep single-line truncation on very small screens as well. We keep
			   a small right padding so the badge doesn't visually collide with the
			   end of the title. */
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			padding-right: 0.5rem;
		}
	}

	/* Larger screens: allow up to 2 lines for titles when there's more horizontal room */
	@media (min-width: 640px) {
		.round-title {
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			white-space: normal; /* allow wrapping inside -webkit-box */
			max-height: calc(1.25em * 2);
			overflow: hidden;
		}
	}
</style>
