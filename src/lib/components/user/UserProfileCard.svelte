<script lang="ts">
	import type { User } from '$lib/types/backend';
	import type { Snippet } from 'svelte';
	import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '$lib/utils/unsplash';
	import { cn } from '$lib/utils';

	type ClickHandler = (payload: { userId: string }) => void;

	type Props = {
		user: User;
		showStats?: boolean;
		onClick?: ClickHandler;
		testid?: string;
		class?: string;
		header?: Snippet;
		headerAction?: { label: string; onClick: () => void; testid?: string };
		children?: Snippet;
	};

	let {
		user,
		showStats = true,
		onClick,
		testid,
		class: incomingClass,
		header,
		headerAction,
		children
	}: Props = $props();

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
</script>

{#if header || headerAction}
	<div class="profile-header">
		{#if header}
			{@render header()}
		{/if}

		{#if headerAction}
			<button
				type="button"
				class="ml-2 inline-flex items-center rounded-md px-2 py-1 text-sm font-medium"
				onclick={headerAction.onClick}
				data-testid={headerAction.testid}
			>
				{headerAction.label}
			</button>
		{/if}
	</div>
{/if}

<button
	class={cn(
		'bg-guild-surface w-full rounded-xl border border-[var(--guild-border)] p-4 shadow-lg transition-all duration-300 hover:shadow-xl',
		onClick ? 'cursor-pointer hover:scale-[1.02]' : '',
		incomingClass
	)}
	onclick={handleClick}
	onkeydown={handleKeydown}
	disabled={!onClick}
	data-testid={testid}
>
	{#if children}
		<div class="profile-content">
			{@render children()}
		</div>
	{:else}
		<div class="flex items-center space-x-4">
			{#if user.avatar_url}
				{#if isUnsplashUrl(user.avatar_url)}
					<picture>
						<source
							type="image/avif"
							srcset={unsplashSrcset(user.avatar_url, [48, 100], 'avif')}
							sizes={unsplashSizes(48)}
						/>
						<source
							type="image/webp"
							srcset={unsplashSrcset(user.avatar_url, [48, 100], 'webp')}
							sizes={unsplashSizes(48)}
						/>
						<img
							src={user.avatar_url}
							alt="{user.username}'s avatar"
							width="48"
							height="48"
							loading="lazy"
							decoding="async"
							crossorigin="anonymous"
							style="aspect-ratio:1/1"
							class="h-12 w-12 rounded-full"
						/>
					</picture>
				{:else}
					<img
						src={user.avatar_url}
						alt="{user.username}'s avatar"
						width="48"
						height="48"
						loading="lazy"
						decoding="async"
						crossorigin="anonymous"
						style="aspect-ratio:1/1"
						class="h-12 w-12 rounded-full"
					/>
				{/if}
			{:else}
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--guild-border)]"
				>
					<span class="font-medium text-[var(--guild-text-secondary)]"
						>{user.username.charAt(0).toUpperCase()}</span
					>
				</div>
			{/if}
			<div class="flex-1">
				<h3 class="text-lg font-semibold text-[var(--guild-text)]">{user.username}</h3>
				{#if showStats}
					<p class="text-sm text-[var(--guild-text-secondary)]">
						Rounds played: {user.total_rounds}
					</p>
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
						<p class="text-xl font-bold text-[var(--guild-secondary)]">
							{user.average_score.toFixed(1)}
						</p>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</button>

<style>
	.profile-header {
		margin-bottom: 1rem;
	}
</style>
