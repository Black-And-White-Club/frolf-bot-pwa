<script lang="ts">
	import { onMount } from 'svelte';
	import type { Round } from '$lib/types/backend';

	export let round: Round;
	export let showStatus: boolean = true;
	export let compact: boolean = false;
	export let showDescription: boolean = true;
	export let showLocation: boolean = true;
	export let dataTestId: string | undefined = undefined;
	export let onRoundClick: (payload: { roundId: string }) => void = () => {};

	let RoundCard: any = null;
	let loaded = false;
	let el: HTMLElement | null = null;

	async function load() {
		if (RoundCard) return;
		try {
			const mod = await import('./RoundCard.svelte');
			RoundCard = mod.default;
			loaded = true;
		} catch (err) {
			// don't block render on failure; keep placeholder
			// eslint-disable-next-line no-console
			console.error('Failed to load RoundCard', err);
		}
	}

	onMount(() => {
		if (typeof IntersectionObserver !== 'undefined' && el) {
			const obs = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							load();
							obs.disconnect();
							break;
						}
					}
				},
				{ rootMargin: '200px' }
			);
			obs.observe(el);
			return () => obs.disconnect();
		}

		// fallback: load during idle
		if (typeof requestIdleCallback !== 'undefined') {
			(requestIdleCallback as any)(() => load());
		} else {
			setTimeout(() => load(), 200);
		}
	});
</script>

<div bind:this={el} data-testid={dataTestId} style="min-height: 110px;">
	{#if loaded && RoundCard}
		<svelte:component
			this={RoundCard}
			{round}
			{showStatus}
			{compact}
			{showDescription}
			{showLocation}
			on:click={(e: CustomEvent<{ roundId: string }>) => onRoundClick?.(e.detail)}
		/>
	{:else}
		<!-- lightweight placeholder to reserve space and avoid layout shift -->
		<div class="round-placeholder" aria-hidden="true">
			<div class="h-28 w-full animate-pulse rounded bg-[var(--guild-surface-elevated)]"></div>
		</div>
	{/if}
</div>

<style>
	.round-placeholder {
		display: block;
		width: 100%;
	}
</style>
