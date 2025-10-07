<script lang="ts">
	import { onMount } from 'svelte';
	import type { User } from '$lib/types/backend';

	export let user: User;
	export let showStats: boolean = true;
	export let testid: string | undefined = undefined;

	let UserProfile: any = null;
	let loaded = false;
	let el: HTMLElement | null = null;

	async function load() {
		if (UserProfile) return;
		try {
			const mod = await import('./UserProfile.svelte');
			UserProfile = mod.default;
			loaded = true;
		} catch (err) {
			console.error('Failed to load UserProfile', err);
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
	{#if loaded && UserProfile}
		<svelte:component this={UserProfile} {user} {showStats} {testid} />
	{:else}
		<p class="loading-text">Loading profile…</p>
	{/if}
</div>

<style>
	.loading-text {
		color: var(--guild-text-secondary);
	}
</style>
