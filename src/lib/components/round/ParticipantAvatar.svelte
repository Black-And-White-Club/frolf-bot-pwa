<script lang="ts">
	export let avatar_url: string | undefined;
	export let username: string;
	export let size: number = 24; // px
	export let extraClasses: string = '';
	// If true, this image will be treated as high-priority and loaded eagerly.
	// Default is false to avoid increasing initial render contention.
	export let priority: boolean = false;

	import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '$lib/utils/unsplash';

	// derived attrs for external unsplash images
	let _isUnsplash = false;
	let _srcset: string | undefined;
	let _sizes: string | undefined;
	let _loading: 'lazy' | 'eager' = 'lazy';

	$: _isUnsplash = isUnsplashUrl(avatar_url);
	$: _srcset = _isUnsplash && avatar_url ? unsplashSrcset(avatar_url, [size, size * 2]) : undefined;
	$: _sizes = _isUnsplash ? unsplashSizes(size) : undefined;
	// Keep avatars lazy by default to avoid many images competing for network during
	// initial render. Consumers can opt into eager loading by setting `priority`.
	$: _loading = priority ? 'eager' : 'lazy';

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
					on:load={handleLoad}
					on:error={handleError}
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
				on:load={handleLoad}
				on:error={handleError}
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
