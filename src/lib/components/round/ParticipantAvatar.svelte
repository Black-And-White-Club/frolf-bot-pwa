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

	const isUnsplash = $derived(isUnsplashUrl(avatar_url));
	const sizes = $derived(isUnsplash ? unsplashSizes(size) : undefined);
	const loading = $derived(priority ? 'eager' : 'lazy');

	let loaded = $state(false);
	let errored = $state(false);

	function handleLoad() {
		loaded = true;
	}

	function handleError() {
		errored = true;
	}

	const initial = $derived(username ? username.charAt(0).toUpperCase() : '?');
</script>

<div class="avatar-container {extraClasses}" style="--size: {size}px;">
	{#if avatar_url && !errored}
		{#if isUnsplash}
			<picture>
				<source
					type="image/avif"
					srcset={unsplashSrcset(avatar_url, [size, size * 2], 'avif')}
					{sizes}
				/>
				<source
					type="image/webp"
					srcset={unsplashSrcset(avatar_url, [size, size * 2], 'webp')}
					{sizes}
				/>
				<img
					src={avatar_url}
					alt={username}
					width={size}
					height={size}
					{loading}
					decoding="async"
					onload={handleLoad}
					onerror={handleError}
					class="avatar-img"
					crossorigin="anonymous"
				/>
			</picture>
		{:else}
			<img
				src={avatar_url}
				alt={username}
				width={size}
				height={size}
				{loading}
				decoding="async"
				onload={handleLoad}
				onerror={handleError}
				class="avatar-img"
			/>
		{/if}

		{#if !loaded}
			<div class="avatar-fallback">
				{initial}
			</div>
		{/if}
	{:else}
		<div class="avatar-placeholder">
			{initial}
		</div>
	{/if}
</div>

<style>
	.avatar-container {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 9999px;
		width: var(--size);
		height: var(--size);
		min-width: var(--size);
		min-height: var(--size);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		border-radius: 9999px;
		object-fit: cover;
		aspect-ratio: 1 / 1;
	}

	.avatar-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background: var(--guild-surface-elevated);
		color: var(--guild-text);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.avatar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: 9999px;
		border: 1px solid var(--guild-border);
		background: var(--guild-surface-elevated);
		color: var(--guild-text);
		font-size: 0.75rem;
		font-weight: 700;
	}
</style>
