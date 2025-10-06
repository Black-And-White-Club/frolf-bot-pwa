<script lang="ts">
	import type { Round } from '$lib/types/backend';
	import { onMount } from 'svelte';
	import RoundHeader from './RoundHeader.svelte';
	import { preloadParticipantDisplay } from './participant-loader';
	import { preloadRoundDetails } from './round-details-loader';
	import { observeOnce } from '$lib/utils/viewport';

	type ClickHandler = (payload: { roundId: string }) => void;

	export let round: Round;
	export let onRoundClick: ClickHandler | undefined = undefined;
	export let showStatus: boolean = true;
	export let compact: boolean = false;
	export let dataTestId: string | undefined = undefined;
	export let showDescription: boolean = true;
	export let showLocation: boolean = true;

	// Optional explicit fields parents may pass to control what the card displays
	export let title: string | undefined = undefined;
	export let description: string | undefined = undefined;
	export let location: string | undefined = undefined;
	export let start_time: string | undefined = undefined;
	export let participants: any[] | undefined = undefined;
	export let status: string | undefined = undefined;
	export let par_total: number | undefined = undefined;

	// Local explicit fields we can forward to child components to avoid coupling
	// children to a full round object when it's not desired
	const localTitle = title ?? round?.title;
	const localDescription = description ?? round?.description;
	const localLocation = location ?? round?.location;
	const localStartTime = start_time ?? round?.start_time;
	const localParticipants = participants ?? round?.participants;
	const localStatus = status ?? round?.status;
	const localParTotal = par_total ?? (round as any)?.par_total ?? (round as any)?.par;

	// Will hold the lazily-loaded components on the client
	let ParticipantDisplay: any = null;
	let RoundDetailsComp: any = null;
	let _preloaded = false;
	let _preloadStarted = false;
	// separate refs for the two branches (button vs div). We pick whichever
	// is rendered during onMount to avoid binding the same variable twice.
	let rootBtn: HTMLElement | null = null;
	let rootDiv: HTMLElement | null = null;
	// reference to the inner wrapper so we can measure it in dev
	let innerEl: HTMLElement | null = null;

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

	async function doPreload() {
		if (_preloaded) return;
		_preloadStarted = true;
		_preloaded = true;
		try {
			const [detailsMod, participantsMod] = await Promise.all([
				preloadRoundDetails(),
				preloadParticipantDisplay()
			]);
			const anyDetails: any = detailsMod;
			const anyParticipants: any = participantsMod;
			RoundDetailsComp = anyDetails?.default ?? anyDetails;
			ParticipantDisplay = anyParticipants?.default ?? anyParticipants;
		} catch {
			// best-effort; leave null to show fallback
		}
	}

	onMount(() => {
		const el = rootBtn ?? rootDiv;
		if (!el) return;

		// Use the shared observer utility to avoid creating one IO per card.
		const unobserve = observeOnce(el, () => {
			void doPreload();
		});
		return () => unobserve();
	});
</script>

{#if onRoundClick}
	<button
		type="button"
		bind:this={rootBtn}
		class={`bg-guild-surface w-full overflow-hidden rounded-xl border border-[var(--guild-border)] shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl`}
		style={`padding: var(--round-outer-padding, ${compact ? '1rem' : '1.5rem'}); min-height: ${compact ? '110px' : '140px'};`}
		on:click={handleClick}
		on:keydown={handleKeydown}
		aria-label={`Round ${round.title ?? round.round_id}`}
		data-testid={dataTestId}
	>
		<div class="round-card-inner" bind:this={innerEl}>
			<RoundHeader {round} {showStatus} />
			{#if RoundDetailsComp}
				<svelte:component
					this={RoundDetailsComp}
					{round}
					{compact}
					{showDescription}
					{showLocation}
					title={localTitle}
					description={localDescription}
					location={localLocation}
					start_time={localStartTime}
				/>
			{:else}
				<!-- lightweight fallback for details -->
				<div
					class="mt-1 text-sm text-[var(--guild-text-secondary)]"
					data-testid={dataTestId ? `${dataTestId}-details-fallback` : undefined}
				>
					Details …
				</div>
			{/if}

			{#if ParticipantDisplay}
				<svelte:component
					this={ParticipantDisplay}
					{round}
					{compact}
					participants={localParticipants}
					status={localStatus}
					par_total={localParTotal}
				/>
			{:else if !_preloadStarted}
				<!-- very small placeholder to avoid large DOM churn from many cards -->
				<div
					class="my-2 h-6 w-24 rounded bg-[var(--guild-surface-elevated)]"
					aria-hidden="true"
				></div>
			{:else}
				<div
					class="mt-2 text-sm text-[var(--guild-text-secondary)]"
					data-testid={dataTestId ? `${dataTestId}-participants-fallback` : undefined}
				>
					Loading participants…
				</div>
			{/if}
		</div>
	</button>
{:else}
	<div
		class={`bg-guild-surface w-full overflow-hidden rounded-xl border border-[var(--guild-border)] shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl`}
		style={`padding: var(--round-outer-padding, ${compact ? '1rem' : '1.5rem'}); min-height: ${compact ? '110px' : '140px'};`}
		aria-label={`Round ${round.title ?? round.round_id}`}
		bind:this={rootDiv}
		data-testid={dataTestId}
	>
		<div class="round-card-inner">
			<RoundHeader {round} {showStatus} />
			{#if RoundDetailsComp}
				<svelte:component
					this={RoundDetailsComp}
					{round}
					{compact}
					{showDescription}
					{showLocation}
					title={localTitle}
					description={localDescription}
					location={localLocation}
					start_time={localStartTime}
				/>
			{:else}
				<div class="mt-1 text-sm text-[var(--guild-text-secondary)]">Details …</div>
			{/if}
			{#if ParticipantDisplay}
				<svelte:component
					this={ParticipantDisplay}
					{round}
					{compact}
					participants={localParticipants}
					status={localStatus}
					par_total={localParTotal}
				/>
			{:else}
				<div class="mt-2 text-sm text-[var(--guild-text-secondary)]">Loading participants…</div>
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
</style>
