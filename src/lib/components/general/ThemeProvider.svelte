<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersDark, applyTheme, initTheme } from '$lib/stores/theme';
	import { browser } from '$app/environment';
	import type { GuildTheme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let theme: GuildTheme | undefined = undefined;
	export let testid: string | undefined = undefined;

	onMount(() => {
		if (!browser) return;
		initTheme();

		// Optional local override: apply once and let the store stay authoritative afterwards.
		if (theme) {
			applyTheme(theme, get(prefersDark));
		}
	});
</script>

<div data-testid={testid}>
	<slot />
</div>
