<script lang="ts">
	import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '$lib/utils/unsplash';
	import { userProfiles } from '$lib/stores/userProfiles.svelte';

	type Props = {
		userId?: string;
		avatar_url?: string;
		username: string;
		size?: number;
		extraClasses?: string;
		priority?: boolean;
	};

	let {
		userId,
		avatar_url,
		username,
		size = 24,
		extraClasses = '',
		priority = false
	}: Props = $props();

	function optimizeDiscordAvatar(url: string | undefined, targetSize: number) {
		if (!url) return undefined;
		// Only optimize Discord CDN URLs that don't already have query params
		if (url.includes('cdn.discordapp.com') && !url.includes('?')) {
			// multi-resolution support: request 2x size for high-DPI
			const size2x = targetSize * 2;
			const supported = [16, 32, 64, 128, 256, 512, 1024];
			const best = supported.find((s) => s >= size2x) || 1024;
			return `${url}?size=${best}`;
		}
		return url;
	}

	let profileAvatar = $derived(userId ? userProfiles.getAvatarUrl(userId) : undefined);
	let rawAvatarUrl = $derived(avatar_url || profileAvatar);
	let finalAvatarUrl = $derived(optimizeDiscordAvatar(rawAvatarUrl, size));

	let profileDisplayName = $derived(userId ? userProfiles.getDisplayName(userId) : undefined);
	let finalUsername = $derived(profileDisplayName || username);

	const isUnsplash = $derived(isUnsplashUrl(finalAvatarUrl));
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

	const initial = $derived(finalUsername ? finalUsername.charAt(0).toUpperCase() : '?');
</script>

<div class="avatar-container {extraClasses}" style="--size: {size}px;" title={finalUsername}>
	{#if finalAvatarUrl && !errored}
		{#if isUnsplash}
			<picture>
				<source
					type="image/avif"
					srcset={unsplashSrcset(finalAvatarUrl, [size, size * 2], 'avif')}
					{sizes}
				/>
				<source
					type="image/webp"
					srcset={unsplashSrcset(finalAvatarUrl, [size, size * 2], 'webp')}
					{sizes}
				/>
				<img
					src={finalAvatarUrl}
					alt={finalUsername}
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
				src={finalAvatarUrl}
				alt={finalUsername}
				width={size}
				height={size}
				{loading}
				decoding="async"
				onload={handleLoad}
				onerror={handleError}
				class="avatar-img"
				referrerpolicy="no-referrer"
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
