<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { prefersDark } from '$lib/stores/theme';

export let testid: string | undefined = undefined;

let checked = false;
let unsubscribe = () => {};

onMount(() => {
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

<label class="relative inline-flex items-center cursor-pointer">
	<input id="theme-toggle" name="theme-toggle" data-testid={testid} type="checkbox" class="sr-only peer" bind:checked={checked} on:change={toggleDark} />
	<div class="w-16 h-8 bg-[var(--guild-border)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--guild-primary)]/25 rounded-full peer peer-checked:bg-[var(--guild-primary)] transition-colors">
	<div class="absolute top-0 left-0 w-8 h-8 bg-guild-surface rounded-full shadow-md transition-transform peer-checked:translate-x-8 flex items-center justify-center text-lg">
			{#if checked}
				🌙
			{:else}
				☀️
			{/if}
		</div>
	</div>
</label>
