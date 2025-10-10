<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import { cn } from '$lib/utils';
	import RoundHeader from './RoundHeader.svelte';
	import RoundDetails from './RoundDetails.svelte';
	import ParticipantDisplay from './ParticipantDisplay.svelte';
	import ChevronCollapse from '../general/ChevronCollapse.svelte';

	type ClickHandler = (payload: { roundId: string }) => void;

	type Props = {
		round: Round;
		onRoundClick?: ClickHandler;
		showStatus?: boolean;
		compact?: boolean;
		dataTestId?: string;
		showDescription?: boolean;
		showLocation?: boolean;
		title?: string;
		description?: string;
		location?: string;
		start_time?: string;
		participants?: any[];
		status?: string;
		par_total?: number;
		collapsed?: boolean;
		onToggle?: (collapsed: boolean) => void;
		chevronTestid?: string;
		class?: string;
		[key: string]: any;
	};

	let {
		round,
		onRoundClick,
		showStatus = true,
		compact = false,
		dataTestId,
		showDescription = true,
		showLocation = true,
		title,
		description,
		location,
		start_time,
		participants,
		status,
		par_total,
		collapsed = false,
		onToggle,
		chevronTestid,
		class: incomingClass,
		...restProps
	}: Props = $props();

	const localTitle = $derived(title ?? round?.title);
	const localDescription = $derived(description ?? round?.description);
	const localLocation = $derived(location ?? round?.location);
	const localStartTime = $derived(start_time ?? round?.start_time);
	const localParticipants = $derived(participants ?? round?.participants);
	const localStatus = $derived(status ?? round?.status);
	const localParTotal = $derived(par_total ?? (round as any)?.par_total ?? (round as any)?.par);

	const chevronTestId = $derived(
		chevronTestid ?? (dataTestId ? `${dataTestId}-chevron` : undefined)
	);

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

	function toggle() {
		onToggle?.(!collapsed);
	}
</script>

{#if onRoundClick}
	<button
		type="button"
		class={cn(
			'bg-guild-surface w-full overflow-hidden rounded-xl border border-[var(--guild-border)] shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl',
			incomingClass
		)}
		style="padding: var(--round-outer-padding, {compact ? '1rem' : '1.5rem'}); min-height: {compact
			? '110px'
			: '140px'};"
		onclick={handleClick}
		onkeydown={handleKeydown}
		aria-label="Round {round.title ?? round.round_id}"
		data-testid={dataTestId}
		{...restProps}
	>
		<div class="round-card-inner">
			<div class="round-card-header">
				<RoundHeader {round} {showStatus} />
				<ChevronCollapse
					{collapsed}
					disabled={false}
					ariaControls="round-body-{round.round_id}"
					ariaLabel={collapsed ? 'Expand round details' : 'Collapse round details'}
					testid={chevronTestId}
					onclick={toggle}
				/>
			</div>
			{#if !collapsed}
				<div id="round-body-{round.round_id}" class="round-card-body">
					<RoundDetails
						{round}
						{compact}
						{showDescription}
						{showLocation}
						description={localDescription}
						location={localLocation}
						start_time={localStartTime}
					/>
					<ParticipantDisplay
						{round}
						{compact}
						participants={localParticipants}
						status={localStatus}
						par_total={localParTotal}
					/>
				</div>
			{/if}
		</div>
	</button>
{:else}
	<!-- Same structure for div branch -->
	<div
		class={cn(
			'bg-guild-surface w-full overflow-hidden rounded-xl border border-[var(--guild-border)] shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl',
			incomingClass
		)}
		style="padding: var(--round-outer-padding, {compact ? '1rem' : '1.5rem'}); min-height: {compact
			? '110px'
			: '140px'};"
		aria-label="Round {round.title ?? round.round_id}"
		data-testid={dataTestId}
		{...restProps}
	>
		<div class="round-card-inner">
			<div class="round-card-header">
				<RoundHeader {round} {showStatus} />
				<ChevronCollapse
					{collapsed}
					disabled={false}
					ariaControls="round-body-{round.round_id}"
					ariaLabel={collapsed ? 'Expand round details' : 'Collapse round details'}
					testid={chevronTestId}
					onclick={toggle}
				/>
			</div>
			{#if !collapsed}
				<div id="round-body-{round.round_id}" class="round-card-body">
					<RoundDetails
						{round}
						{compact}
						{showDescription}
						{showLocation}
						description={localDescription}
						location={localLocation}
						start_time={localStartTime}
					/>
					<ParticipantDisplay
						{round}
						{compact}
						participants={localParticipants}
						status={localStatus}
						par_total={localParTotal}
					/>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Keep the inner rounded container from being too narrow — makes content feel balanced */
	.round-card-inner {
		/* Fill the parent's content box (parent defines padding). This avoids
		   calc-based rounding issues and ensures the inner panel width equals
		   the available content width. */
		width: 100%;
		max-width: var(--round-inner-max-width, 720px);
		box-sizing: border-box;
		overflow-wrap: anywhere; /* break long words/URLs */
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		/* Default desktop alignment: left-aligned content */
		text-align: left;
		align-items: stretch;
		justify-content: flex-start;
	}

	/* Make any direct child fill the inner wrapper so inner 'mini-cards' match width */
	.round-card-inner > * {
		width: 100%;
		box-sizing: border-box;
		/* inherit text alignment from the wrapper (desktop: left, mobile: center) */
		text-align: inherit;
	}

	@media (max-width: 640px) {
		.round-card-inner {
			min-width: unset;
			width: 100%;
			/* On small screens keep left alignment for better readability */
			text-align: left;
			align-items: flex-start;
		}
		.round-card-inner > * {
			text-align: inherit;
		}
	}

	/* Ensure consistent minimum width on medium and larger screens so inner cards are uniform */
	@media (min-width: 640px) {
		.round-card-inner {
			min-width: var(--round-inner-min-width, 520px);
			max-width: var(--round-inner-max-width, 720px);
		}
	}

	/* Ensure the inner wrapper can position children absolutely when needed */
	.round-card-inner {
		position: relative;
	}

	.round-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.round-card-body {
		margin-top: 0.75rem;
	}
</style>
