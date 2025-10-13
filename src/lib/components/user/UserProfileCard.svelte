<script lang="ts">
	import Button from '$lib/components/general/Button.svelte';
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

	// (no reactive statement here; normalization is done inline where used)

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

<!-- Header row -->
<div class="profile-header">
	<div class="profile-title">
		{#if header}
			{@render header()}
		{:else}
			<h4 class="text-sm font-medium text-[var(--guild-text-secondary)]">Your Stats</h4>
		{/if}
	</div>

	{#if headerAction}
		<Button
			variant="secondary"
			size="sm"
			onclick={headerAction.onClick}
			data-testid={headerAction.testid ?? 'btn-view-profile'}
		>
			{headerAction.label}
		</Button>
	{/if}
</div>

<!-- Card body -->
{#if onClick}
	<button
		class={cn(
			'profile-card bg-guild-surface w-full rounded-xl border border-[var(--guild-border)] p-4 shadow-lg transition-all duration-300 hover:shadow-xl',
			'cursor-pointer hover:scale-[1.02]',
			incomingClass
		)}
		onclick={handleClick}
		onkeydown={handleKeydown}
		data-testid={testid}
	>
		{#if children}
			<div class="profile-content">
				{@render children()}
			</div>
		{:else}
			<div class="profile-row flex items-center">
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
								class="profile-avatar h-12 w-12 rounded-full"
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
							class="profile-avatar h-12 w-12 rounded-full"
						/>
					{/if}
				{:else}
					<div
						class="profile-avatar--placeholder flex h-12 w-12 items-center justify-center rounded-full"
					>
						<span class="font-medium text-[var(--guild-text-secondary)]"
							>{user.username.charAt(0).toUpperCase()}</span
						>
					</div>
				{/if}

				<div class="profile-name flex-1">
					<h3 class="profile-username text-lg font-semibold text-[var(--guild-text)]">
						{user.username}
					</h3>

					{#if showStats}
						<div class="profile-rounds text-sm text-[var(--guild-text-secondary)]">
							Rounds: {user.total_rounds}
						</div>
					{/if}
				</div>
			</div>

			{#if showStats && (user.best_score !== undefined || user.average_score !== undefined)}
				<div class="profile-stats mt-4 grid grid-cols-2 gap-4">
					{#if user.best_score !== undefined}
						<div class="stat-item text-center">
							<p class="font-space text-sm text-[var(--guild-text-secondary)]">Best Score</p>
							<p class="font-space stat-value stat-best text-xl font-bold">{user.best_score}</p>
						</div>
					{/if}
					{#if user.average_score !== undefined}
						<div class="stat-item text-center">
							<p class="font-space text-sm text-[var(--guild-text-secondary)]">Average</p>
							<p class="font-space stat-value stat-average text-xl font-bold">
								{user.average_score.toFixed(1)}
							</p>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</button>
{:else}
	<div
		class={cn(
			'profile-card bg-guild-surface w-full rounded-xl border border-[var(--guild-border)] p-4 shadow-lg transition-all duration-300 hover:shadow-xl',
			incomingClass
		)}
		data-testid={testid}
	>
		{#if children}
			<div class="profile-content">
				{@render children()}
			</div>
		{:else}
			<div class="profile-row flex items-center">
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
								class="profile-avatar h-12 w-12 rounded-full"
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
							class="profile-avatar h-12 w-12 rounded-full"
						/>
					{/if}
				{:else}
					<div
						class="profile-avatar--placeholder flex h-12 w-12 items-center justify-center rounded-full"
					>
						<span class="font-medium text-[var(--guild-text-secondary)]"
							>{user.username.charAt(0).toUpperCase()}</span
						>
					</div>
				{/if}

				<div class="profile-name flex-1">
					<h3 class="profile-username text-lg font-semibold text-[var(--guild-text)]">
						{user.username}
					</h3>

					{#if showStats}
						<div class="profile-rounds text-sm text-[var(--guild-text-secondary)]">
							Rounds Played: {user.total_rounds}
						</div>
					{/if}
				</div>
			</div>

			{#if showStats && (user.best_score !== undefined || user.average_score !== undefined)}
				<div class="profile-stats mt-4 grid grid-cols-2 gap-4">
					{#if user.best_score !== undefined}
						<div class="stat-item text-center">
							<p class="font-space text-sm text-[var(--guild-text-secondary)]">Best Score</p>
							<p class="font-space stat-value stat-best text-xl font-bold">{user.best_score}</p>
						</div>
					{/if}
					{#if user.average_score !== undefined}
						<div class="stat-item text-center">
							<p class="font-space text-sm text-[var(--guild-text-secondary)]">Average</p>
							<p class="font-space stat-value stat-average text-xl font-bold">
								{user.average_score.toFixed(1)}
							</p>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	/* Header */
	.profile-header {
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.profile-title h4 {
		font-family:
			'Space Grotesk',
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial;
		font-weight: 700;
		font-size: 1rem;
		color: var(--guild-text);
	}

	/* Card */
	.profile-card {
		position: relative;
		overflow: visible;
		background: var(--guild-surface);
		border-radius: 0.75rem;
		border: 1px solid var(--guild-border);
		box-shadow: 0 6px 14px rgba(10, 10, 10, 0.06);
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
		padding: 1rem;
	}

	.profile-card:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 6px rgba(var(--guild-primary-rgb), 0.1),
			0 8px 18px rgba(10, 10, 10, 0.08);
	}

	.profile-avatar {
		flex: 0 0 auto;
		border-radius: 9999px;
		border: 2px solid transparent;
		background-clip: padding-box;
		/* subtle ring using primary */
		box-shadow: 0 0 0 3px rgba(var(--guild-primary-rgb), 0.06) inset;
	}

	.profile-row {
		/* Use a 2-column grid so the top row aligns to the two stat columns below (best | average).
		   Column 1: avatar (centered)  Column 2: name + rounds (centered) */
		display: grid;
		/* use equal-width columns so the top row lines up with the two stat columns below */
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		align-items: center;
	}

	.profile-name {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0; /* allow the name to shrink inside flex */
		overflow: hidden;
		align-items: center; /* center name + rounds above the right stat column */
		text-align: center;
		justify-self: center;
	}

	.profile-username {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.profile-rounds {
		color: var(--guild-text-secondary);
		line-height: 1;
		font-weight: 600;
	}

	/* center avatar (img or placeholder) in the first grid column. The image is often wrapped
	   in a <picture>, so target the picture and any descendant with .profile-avatar. Also force
	   the avatar into column 1 so it sits over the left stat column. */
	.profile-row picture,
	.profile-row .profile-avatar,
	.profile-row .profile-avatar--placeholder {
		justify-self: center;
		grid-column: 1;
	}

	/* ensure name block sits over the right stat column */
	.profile-name {
		grid-column: 2;
	}

	@media (prefers-reduced-motion: reduce) {
		.profile-row {
			transition: none;
		}
	}

	.profile-avatar--placeholder {
		background: linear-gradient(
			180deg,
			rgba(var(--color-secondary), 0.06),
			rgba(var(--color-primary), 0.03)
		);
		color: var(--guild-text-secondary);
	}

	.profile-username {
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial;
		letter-spacing: -0.01em;
		color: var(--guild-text);
	}

	/* Stats */
	.profile-stats {
		margin-top: 0.5rem;
	}

	.stat-item {
		padding: 0.25rem 0.5rem;
	}

	.stat-value {
		font-size: 1.125rem;
		margin-top: 0.25rem;
	}

	.stat-best {
		color: var(--guild-primary);
	}

	.stat-average {
		color: var(--guild-secondary);
	}

	/* Responsive tweaks */
	@media (min-width: 640px) {
		.profile-card {
			padding: 1.125rem;
		}
		.stat-value {
			font-size: 1.25rem;
		}
		.profile-row {
			gap: 1rem;
		}
	}
</style>
