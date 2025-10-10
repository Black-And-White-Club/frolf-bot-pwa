<script lang="ts">
	import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '$lib/utils/unsplash';

	type Props = {
		avatar_url?: string;
		username: string;
		size?: number;
		extraClasses?: string;
		priority?: boolean;
	};

	let { avatar_url, username, size = 24, extraClasses = '', priority = false }: Props = $props();

	// derived attrs for external unsplash images
	const _isUnsplash = $derived(isUnsplashUrl(avatar_url));
	const _srcset = $derived(
		_isUnsplash && avatar_url ? unsplashSrcset(avatar_url, [size, size * 2]) : undefined
	);
	const _sizes = $derived(_isUnsplash ? unsplashSizes(size) : undefined);
	// Keep avatars lazy by default to avoid many images competing for network during
	// initial render. Consumers can opt into eager loading by setting `priority`.
	const _loading = $derived(priority ? 'eager' : 'lazy');

	// Local state to track load/error so we can show the fallback initial
	let loaded = $state(false);
	let errored = $state(false);

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
		<!-- Use picture to serve AVIF/WebP for Unsplash images, fallback to original for others -->
		{#if _isUnsplash}
			<picture>
				<source
					type="image/avif"
					srcset={unsplashSrcset(avatar_url, [size, size * 2], 'avif')}
					sizes={_sizes}
				/>
				<source
					type="image/webp"
					srcset={unsplashSrcset(avatar_url, [size, size * 2], 'webp')}
					sizes={_sizes}
				/>
				<img
					src={avatar_url}
					alt={username}
					width={size}
					height={size}
					loading={_loading}
					decoding="async"
					onload={handleLoad}
					onerror={handleError}
					class="h-full w-full rounded-full object-cover"
					style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; aspect-ratio:1/1;"
					crossorigin="anonymous"
				/>
			</picture>
		{:else}
			<img
				src={avatar_url}
				alt={username}
				width={size}
				height={size}
				loading={_loading}
				decoding="async"
				onload={handleLoad}
				onerror={handleError}
				class="h-full w-full rounded-full object-cover"
				style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; aspect-ratio:1/1;"
			/>
		{/if}
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
