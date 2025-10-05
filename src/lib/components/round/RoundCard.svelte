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

	// Will hold the lazily-loaded components on the client
	let ParticipantDisplay: any = null;
	let RoundDetailsComp: any = null;
	let _preloaded = false;
	let _preloadStarted = false;
	let rootEl: HTMLElement | null = null;

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
		if (!rootEl) return;

		// Use the shared observer utility to avoid creating one IO per card.
		const unobserve = observeOnce(rootEl, () => {
			void doPreload();
		});

		return () => unobserve();
	});
</script>

{#if onRoundClick}
	<button
		type="button"
		class={`bg-guild-surface rounded-xl border border-[var(--guild-border)] shadow-lg hover:shadow-xl ${compact ? 'p-4' : 'p-6'} transition-all duration-300 hover:scale-[1.02]`}
		on:click={handleClick}
		on:keydown={handleKeydown}
		aria-label={`Round ${round.title ?? round.round_id}`}
		data-testid={dataTestId}
	>
		<RoundHeader {round} {showStatus} />
		{#if RoundDetailsComp}
			<svelte:component this={RoundDetailsComp} {round} {compact} />
		{:else if !_preloadStarted}
			<!-- super-light skeleton to keep DOM small until card nears viewport -->
			<div
				class="my-1 h-4 w-1/2 rounded bg-[var(--guild-surface-elevated)]"
				aria-hidden="true"
			></div>
		{:else}
			<!-- lightweight fallback for details -->
			<div class="mt-1 text-sm text-[var(--guild-text-secondary)]">Details …</div>
		{/if}
		{#if ParticipantDisplay}
			<svelte:component this={ParticipantDisplay} {round} {compact} />
		{:else if !_preloadStarted}
			<!-- very small placeholder to avoid large DOM churn from many cards -->
			<div
				class="my-2 h-6 w-24 rounded bg-[var(--guild-surface-elevated)]"
				aria-hidden="true"
			></div>
		{:else}
			<div class="mt-2 text-sm text-[var(--guild-text-secondary)]">Loading participants…</div>
		{/if}
	</button>
{:else}
	<div
		class={`bg-guild-surface rounded-xl border border-[var(--guild-border)] shadow-lg hover:shadow-xl ${compact ? 'p-4' : 'p-6'} transition-all duration-300 hover:scale-[1.02]`}
		aria-label={`Round ${round.title ?? round.round_id}`}
		data-testid={dataTestId}
	>
		<RoundHeader {round} {showStatus} />
		{#if RoundDetailsComp}
			<svelte:component this={RoundDetailsComp} {round} {compact} />
		{:else}
			<div class="mt-1 text-sm text-[var(--guild-text-secondary)]">Details …</div>
		{/if}
		{#if ParticipantDisplay}
			<svelte:component this={ParticipantDisplay} {round} {compact} />
		{:else}
			<div class="mt-2 text-sm text-[var(--guild-text-secondary)]">Loading participants…</div>
		{/if}
	</div>
{/if}
