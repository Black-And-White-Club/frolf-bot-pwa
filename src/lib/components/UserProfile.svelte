<script lang="ts">
	import type { User } from '$lib/types/backend';

	type ClickHandler = (payload: { userId: string }) => void;

	export let user: User;
	export let showStats: boolean = true;
	export let onClick: ClickHandler | undefined = undefined;
	export let testid: string | undefined = undefined;

	function handleClick() {
		if (onClick) {
			onClick({ userId: user.user_id });
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (onClick) {
				onClick({ userId: user.user_id });
			}
		}
	}

	// Custom action to conditionally set tabindex
	function tabindex(node: HTMLElement, condition: boolean) {
		if (condition) {
			node.setAttribute('tabindex', '0');
		} else {
			node.removeAttribute('tabindex');
		}
	}

	import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '$lib/utils/unsplash';
</script>

<div
	class="bg-guild-surface rounded-xl shadow-lg border border-[var(--guild-border)] p-4 hover:shadow-xl transition-all duration-300 {onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}"
	on:click={handleClick}
	on:keydown={handleKeydown}
	role={onClick ? "button" : undefined}
	use:tabindex={!!onClick}
	data-testid={testid}
>
	<div class="flex items-center space-x-4">
		{#if user.avatar_url}
			<img
				src={user.avatar_url}
				alt="{user.username}'s avatar"
				width="48"
				height="48"
				loading="lazy"
				decoding="async"
				crossorigin="anonymous"
				style="aspect-ratio:1/1"
				class="w-12 h-12 rounded-full"
				srcset={isUnsplashUrl(user.avatar_url) ? unsplashSrcset(user.avatar_url, [48, 100]) : undefined}
				sizes={isUnsplashUrl(user.avatar_url) ? unsplashSizes(48) : undefined}
			/>
		{:else}
			<div class="w-12 h-12 rounded-full bg-[var(--guild-border)] flex items-center justify-center">
				<span class="text-[var(--guild-text-secondary)] font-medium">{user.username.charAt(0).toUpperCase()}</span>
			</div>
		{/if}
		<div class="flex-1">
			<h3 class="text-lg font-semibold text-[var(--guild-text)]">{user.username}</h3>
			{#if showStats}
				<p class="text-sm text-[var(--guild-text-secondary)]">Rounds played: {user.total_rounds}</p>
			{/if}
		</div>
	</div>

	{#if showStats && (user.best_score !== undefined || user.average_score !== undefined)}
		<div class="mt-4 grid grid-cols-2 gap-4">
			{#if user.best_score !== undefined}
				<div class="text-center">
					<p class="text-sm font-medium text-[var(--guild-text-secondary)]">Best Score</p>
					<p class="text-xl font-bold text-[var(--guild-primary)]">{user.best_score}</p>
				</div>
			{/if}
			{#if user.average_score !== undefined}
				<div class="text-center">
					<p class="text-sm font-medium text-[var(--guild-text-secondary)]">Average</p>
					<p class="text-xl font-bold text-[var(--guild-secondary)]">{user.average_score.toFixed(1)}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
