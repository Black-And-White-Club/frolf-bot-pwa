<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersDark, initTheme } from '$lib/stores/theme';

	type Props = {
		testid?: string;
		size?: 'sm' | 'md';
		compact?: boolean;
	};

	let { testid, size = 'md', compact = false }: Props = $props();

	let isDark = $state(false);
	let unsub: (() => void) | undefined;

	// computed class strings for the track and knob to keep markup clean
	const trackClasses = $derived(
		`relative inline-block rounded-full bg-[var(--guild-border)] border border-[var(--guild-text-secondary)]/30 transition-colors duration-200 ${
			size === 'sm' ? 'h-5 w-10' : 'h-6 w-12'
		}`
	);

	const knobClasses = $derived(
		`absolute top-px left-px rounded-full bg-[var(--guild-surface)] shadow-md transition-transform duration-200 ${
			size === 'sm' ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]'
		} ${isDark ? (size === 'sm' ? 'translate-x-5' : 'translate-x-6') : ''}`
	);

	onMount(() => {
		// Ensure global theme system is initialized (no-op on SSR)
		try {
			initTheme();
		} catch {
			/* ignore */
		}

		unsub = prefersDark.subscribe((v) => (isDark = !!v));

		return () => {
			try {
				unsub?.();
			} catch {
				/* ignore */
			}
		};
	});

	function toggle() {
		const next = !isDark;
		prefersDark.set(next);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggle();
		}
	}
</script>

<!-- Slider-style toggle: accessible, keyboard-focusable, uses CSS variables for colors -->
<button
	type="button"
	onclick={toggle}
	onkeydown={handleKeydown}
	data-testid={testid}
	aria-pressed={isDark}
	aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
	class="inline-flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--guild-primary)]/30"
>
	<span class="sr-only">{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</span>

	<!-- Track: computed classes to keep markup simpler -->
	<span class={trackClasses}>
		<span class={knobClasses}></span>
	</span>

	{#if !compact}
		<span class="ml-2 text-sm font-medium text-[var(--guild-text)]">
			{isDark ? '🌖' : '☀️'}
		</span>
	{/if}
</button>
