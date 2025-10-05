<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { prefersDark } from '$lib/stores/theme';
	import { browser } from '$app/environment';

	export let testid: string | undefined = undefined;

	let checked = false;
	let unsubscribe = () => {};

	onMount(() => {
		if (!browser) return;
		// subscribe to the prefersDark store (theme.ts will persist and toggle DOM class)
		unsubscribe = prefersDark.subscribe((v) => (checked = v));
	});

	onDestroy(() => {
		unsubscribe();
	});

	function toggleDark() {
		// Atomically flip the prefersDark store to avoid races between binding and subscriptions
		prefersDark.update((v) => {
			const nv = !v;
			return nv;
		});
	}
</script>

<label class="relative inline-flex cursor-pointer items-center">
	<input
		id="theme-toggle"
		name="theme-toggle"
		data-testid={testid}
		type="checkbox"
		class="peer sr-only"
		bind:checked
		on:change={toggleDark}
	/>
	<div
		class="peer h-8 w-16 rounded-full bg-[var(--guild-border)] transition-colors peer-checked:bg-[var(--guild-primary)] peer-focus:ring-4 peer-focus:ring-[var(--guild-primary)]/25 peer-focus:outline-none"
	>
		<div
			class="bg-guild-surface absolute top-0 left-0 flex h-8 w-8 items-center justify-center rounded-full text-lg shadow-md transition-transform peer-checked:translate-x-8"
		>
			{#if checked}
				🌙
			{:else}
				☀️
			{/if}
		</div>
	</div>
</label>
