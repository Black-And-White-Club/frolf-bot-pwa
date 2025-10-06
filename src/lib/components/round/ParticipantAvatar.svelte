<script lang="ts">
	export let avatar_url: string | undefined;
	export let username: string;
	export let size: number = 24; // px
	export let extraClasses: string = '';

	// Local state to track load/error so we can show the fallback initial
	let loaded = false;
	let errored = false;

	function handleLoad() {
		loaded = true;
	}

	function handleError() {
		errored = true;
	}
</script>

<div
	class={`relative inline-flex items-center justify-center overflow-hidden rounded-full ${extraClasses}`}
	style={`width:${size}px;height:${size}px;min-width:${size}px;min-height:${size}px;`}
>
	{#if avatar_url && !errored}
		<!-- Use pixelated rendering for avatar images when available -->
		<img
			src={avatar_url}
			alt={username}
			width={size}
			height={size}
			loading="lazy"
			decoding="async"
			on:load={handleLoad}
			on:error={handleError}
			class="h-full w-full rounded-full object-cover"
			style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; aspect-ratio:1/1;"
		/>
		<!-- fallback initial shown until image loads -->
		<div
			class="bg-guild-surface-elevated absolute inset-0 flex items-center justify-center rounded-full text-xs font-bold text-[var(--guild-text)]"
			aria-hidden={!loaded}
			style:display={loaded ? 'none' : 'flex'}
		>
			{username ? username.charAt(0).toUpperCase() : '?'}
		</div>
	{:else}
		<!-- Neutral initials-only placeholder (no color blocks) -->
		<div
			class="bg-guild-surface-elevated flex h-full w-full items-center justify-center rounded-full border border-[var(--guild-border)] text-xs font-bold text-[var(--guild-text)]"
			aria-hidden="true"
		>
			{username ? username.charAt(0).toUpperCase() : '?'}
		</div>
	{/if}
</div>
