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
	class={`bg-guild-surface rounded-xl shadow-lg hover:shadow-xl border border-[var(--guild-border)] ${compact ? 'p-4' : 'p-6'} transition-all duration-300 hover:scale-[1.02]`}
	on:click={handleClick}
	on:keydown={handleKeydown}
	aria-label={`Round ${round.title ?? round.round_id}`}
	data-testid={dataTestId}
  >
	<RoundHeader {round} {showStatus} />
			{#if RoundDetailsComp}
			<svelte:component this={RoundDetailsComp} {round} {compact} />
			{:else}
				{#if !_preloadStarted}
					<!-- super-light skeleton to keep DOM small until card nears viewport -->
					<div class="h-4 bg-[var(--guild-surface-elevated)] rounded w-1/2 my-1" aria-hidden="true"></div>
				{:else}
					<!-- lightweight fallback for details -->
					<div class="text-sm text-[var(--guild-text-secondary)] mt-1">Details …</div>
				{/if}
		{/if}
			{#if ParticipantDisplay}
			<svelte:component this={ParticipantDisplay} {round} {compact} />
		{:else}
				{#if !_preloadStarted}
					<!-- very small placeholder to avoid large DOM churn from many cards -->
					<div class="h-6 w-24 bg-[var(--guild-surface-elevated)] rounded my-2" aria-hidden="true"></div>
				{:else}
					<div class="text-sm text-[var(--guild-text-secondary)] mt-2">Loading participants…</div>
				{/if}
		{/if}
  </button>
{:else}
  <div
	class={`bg-guild-surface rounded-xl shadow-lg hover:shadow-xl border border-[var(--guild-border)] ${compact ? 'p-4' : 'p-6'} transition-all duration-300 hover:scale-[1.02]`}
	aria-label={`Round ${round.title ?? round.round_id}`}
	data-testid={dataTestId}
  >
	<RoundHeader {round} {showStatus} />
		{#if RoundDetailsComp}
			<svelte:component this={RoundDetailsComp} {round} {compact} />
		{:else}
			<div class="text-sm text-[var(--guild-text-secondary)] mt-1">Details …</div>
		{/if}
	{#if ParticipantDisplay}
		<svelte:component this={ParticipantDisplay} {round} {compact} />
	{:else}
		<div class="text-sm text-[var(--guild-text-secondary)] mt-2">Loading participants…</div>
	{/if}
  </div>
{/if}
