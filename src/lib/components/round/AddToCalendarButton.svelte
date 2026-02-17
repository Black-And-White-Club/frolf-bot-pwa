<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import { announce } from '$lib/stores/announcer';
	// CSS is loaded dynamically on click to avoid render blocking
	// import 'add-to-calendar-button/assets/css/atcb.css';

	type Props = {
		round: Round;
		showCaption?: boolean;
		showIcon?: boolean;
		small?: boolean;
		captionText?: string;
		testid?: string;
		children?: import('svelte').Snippet;
	};

	let {
		round,
		showCaption = false,
		showIcon = true,
		small = false,
		captionText = 'Click to add to calendar',
		testid,
		children
	}: Props = $props();

	// unique id for the caption (used for aria-describedby)
	const tipId = $derived(
		`add-to-calendar-tip-${round?.round_id ?? Math.random().toString(36).slice(2, 8)}`
	);

	function formatDateForLabel(dateString: string | undefined) {
		if (!dateString) return 'TBD';
		return new Date(dateString).toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	const formattedDate = $derived(formatDateForLabel(round?.start_time ?? undefined));

	async function handleAction(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		const startDate = round.start_time ? new Date(round.start_time) : new Date(round.created_at);
		const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

		// Helper to format date as YYYY-MM-DD
		const toDateStr = (d: Date) => d.toISOString().split('T')[0];
		// Helper to format time as HH:mm
		const toTimeStr = (d: Date) => d.toTimeString().slice(0, 5);

		const { atcb_action } = await import('add-to-calendar-button');
		await import('$lib/assets/atcb.css');

		atcb_action({
			name: `Disc Golf Round: ${round.title}`,
			description: round.description || `Round at ${round.location || 'TBD'}`,
			startDate: toDateStr(startDate),
			startTime: toTimeStr(startDate),
			endDate: toDateStr(endDate),
			endTime: toTimeStr(endDate),
			location: round.location || 'TBD',
			options: ['Apple', 'Google', 'iCal', 'Microsoft365', 'Outlook.com', 'Yahoo'],
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
		});

		announce('Opened calendar options');
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleAction(e);
		}
	}
</script>

<div class="add-to-calendar" data-testid={testid}>
	<button
		type="button"
		class="add-to-calendar-btn"
		title="Add to calendar"
		aria-describedby={showCaption ? tipId : undefined}
		aria-label={`Add ${formattedDate} to calendar`}
		data-tooltip={captionText}
		data-small={small}
		data-iconless={!showIcon ? 'true' : undefined}
		onclick={handleAction}
		onkeydown={handleKey}
	>
		{#if showIcon}
			<svg class="calendar-svg h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
				></path>
			</svg>
		{/if}
		<span class="slot-content">{@render children?.()}</span>
	</button>

	{#if showCaption}
		<div id={tipId} class="sr-only">{captionText}</div>
	{/if}
</div>

<style>
	.add-to-calendar {
		display: inline-flex;
		align-items: center; /* keep button centered on the text baseline */
		position: relative; /* caption will be absolutely positioned to avoid changing layout */
		/* ensure this inline component aligns with surrounding inline text/icon rows */
		vertical-align: middle;
		--icon-size: 1rem; /* default icon size (16px) shared with inline rows */
	}

	.add-to-calendar-btn {
		display: inline-flex;
		align-items: center;
		justify-content: flex-start;
		/* comfortable touch padding */
		padding: 0.125rem 0.375rem;
		/* inherit line-height so baseline matching is consistent with surrounding text */
		line-height: inherit;
		vertical-align: middle;
		border-radius: 0.375rem;
		background: transparent;
		color: inherit;
		border: none;
		cursor: pointer;
	}

	/* small inline variant (minimal padding so it doesn't increase line-height) */
	.add-to-calendar-btn[data-small='true'] {
		/* minimal inline-flex to preserve baseline and alignment */
		display: inline-flex;
		align-items: center;
		padding: 0 0.125rem;
		/* avoid forcing height/line-height so text keeps natural vertical rhythm */
		vertical-align: middle;
	}

	/* when small and iconless we want absolutely minimal padding so the text aligns with
	   other inline IconTextRow rows (no extra click-box offset) */
	.add-to-calendar-btn[data-small='true'][data-iconless='true'] {
		padding-left: 0;
		padding-right: 0.0625rem; /* keep a tiny buffer for touch */
	}

	/* when button is small and used with icon only, ensure the icon remains visible and not clipped */
	.add-to-calendar-btn[data-small='true'] > svg {
		width: var(--icon-size);
		height: var(--icon-size);
		margin-right: 0.375rem;
	}

	.add-to-calendar-btn[data-small='true'] > .slot-content {
		display: inline-block;
		flex: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 12rem; /* safety cap for very long dates to keep inline spacing */
		font-size: inherit;
		vertical-align: middle;
	}

	.add-to-calendar-btn:focus-visible {
		outline: 2px solid var(--guild-primary);
		outline-offset: 2px;
	}

	.slot-content {
		color: var(--guild-text-secondary);
		font-size: inherit; /* match surrounding text (e.g. text-sm) so vertical metrics line up */
		min-width: 0; /* allow truncation inside flex containers */
		flex: 1 1 auto;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Desktop tooltip (visible on hover and keyboard focus) */
	.add-to-calendar-btn[data-tooltip] {
		position: relative;
	}

	/* make svg and text inside the button follow the same vertical metrics as icon rows */
	.add-to-calendar-btn > svg,
	.add-to-calendar-btn > .slot-content {
		vertical-align: middle;
	}

	/* When this component is used inside an IconTextRow (as an icon slot),
	   make the button visually behave like the raw svg so the text lines up
	   exactly with other IconTextRow instances. Keep the selector specific
	   to avoid affecting other uses. */
	:global(.icon-text-row) .add-to-calendar {
		display: inline-flex;
		align-items: center;
	}

	:global(.icon-text-row) .add-to-calendar .add-to-calendar-btn {
		padding: 0;
		margin: 0;
		width: var(--icon-size);
		height: var(--icon-size);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	:global(.icon-text-row) .add-to-calendar .add-to-calendar-btn > svg {
		width: var(--icon-size);
		height: var(--icon-size);
		display: block;
	}

	/* inside IconTextRow the row gap handles spacing, so remove svg margin here */
	:global(.icon-text-row) .add-to-calendar .add-to-calendar-btn > svg {
		margin-right: 0;
	}

	/* size SVG from local variable so icons across rows match; stroke inherits currentColor unless overridden */
	.add-to-calendar-btn > svg {
		width: var(--icon-size);
		height: var(--icon-size);
		stroke: var(--icon-color, currentColor);
	}

	/* calendar-specific svg class keeps consistent spacing when used icon-only */
	.calendar-svg {
		margin-right: 0.375rem; /* match IconTextRow gap */
		flex-shrink: 0;
	}

	@media (min-width: 768px) {
		.add-to-calendar-btn[data-tooltip]:hover::after,
		.add-to-calendar-btn[data-tooltip]:focus-visible::after {
			content: attr(data-tooltip);
			position: absolute;
			top: -1.9rem;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(20, 20, 20, 0.96);
			color: #eee;
			padding: 0.25rem 0.5rem;
			border-radius: 0.375rem;
			font-size: 0.6875rem;
			white-space: nowrap;
			box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
			z-index: 30;
		}
	}

	/* Expand hit target for small icon-only buttons on touch devices without changing layout */
	@media (hover: none) and (pointer: coarse), (max-width: 639px) {
		.add-to-calendar-btn[data-small='true']::after {
			content: '';
			position: absolute;
			left: -8px;
			right: -8px;
			top: -8px;
			bottom: -8px;
			/* no visual effect; clicks on the pseudo-element count for the button */
		}
		.add-to-calendar-btn[data-small='true'] {
			position: relative; /* needed for ::after expansion */
		}
	}

	/* visually-hidden but still available to screen readers */
	.sr-only {
		position: absolute !important;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
