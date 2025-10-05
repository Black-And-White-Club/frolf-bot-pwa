<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentTheme, prefersDark, applyTheme, initTheme } from '$lib/stores/theme';
	import { browser } from '$app/environment';
	import type { GuildTheme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let theme: GuildTheme | undefined = undefined;
	export let testid: string | undefined = undefined;

	// Initialize theme system and subscribe to changes (idempotent)
	let unsubPrefers: () => void = () => {};
	let unsubTheme: () => void = () => {};

	onMount(() => {
		if (!browser) return;
		initTheme();

		// Apply current state once
		const current = theme || get(currentTheme);
		applyTheme(current, get(prefersDark));

		// Sync with prefersDark store
		unsubPrefers = prefersDark.subscribe((d) => {
			applyTheme(theme || get(currentTheme), d);
		});

		// react to global theme changes when no local theme override supplied
		unsubTheme = currentTheme.subscribe((themeData) => {
			if (!theme) applyTheme(themeData, get(prefersDark));
		});
	});

	onDestroy(() => {
		try {
			unsubPrefers();
		} catch {
			void 0;
		}
		try {
			unsubTheme();
		} catch {
			void 0;
		}
	});
</script>

<div data-testid={testid}>
	<slot />
</div>
