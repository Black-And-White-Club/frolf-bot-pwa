<script lang="ts">
	import { onMount } from 'svelte';
	import type { LeaderboardEntry } from '$lib/types/backend';

	export let entries: LeaderboardEntry[] = [];
	export let limit: number = 10;
	export let showRank: boolean = false;
	export let compact: boolean = false;
	export let testid: string | undefined = undefined;
	export let showViewAll: boolean = false;
	export let minViewAllCount: number = 5;

	let Leaderboard: any = null;
	let loaded = false;
	let el: HTMLElement | null = null;

	async function load() {
		if (Leaderboard) return;
		try {
			const mod = await import('./Leaderboard.svelte');
			Leaderboard = mod.default;
			loaded = true;
		} catch (err) {
			console.error('Failed to load Leaderboard', err);
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

		if (typeof requestIdleCallback !== 'undefined') {
			(requestIdleCallback as any)(() => load());
		} else {
			setTimeout(() => load(), 200);
		}
	});
</script>

<div bind:this={el} data-testid={testid}>
	{#if loaded && Leaderboard}
		<svelte:component
			this={Leaderboard}
			{entries}
			{limit}
			{showRank}
			{compact}
			{testid}
			{showViewAll}
			{minViewAllCount}
		/>
	{:else}
		<p class="loading-text">Loading leaderboard…</p>
	{/if}
</div>

<style>
	.loading-text {
		color: var(--guild-text-secondary);
	}
</style>
