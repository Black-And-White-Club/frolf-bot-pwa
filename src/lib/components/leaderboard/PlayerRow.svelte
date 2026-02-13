<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		userId: string;
		name: string;
		rank?: number;
		isCurrentUser?: boolean;
		compact?: boolean;
		showRank?: boolean;
		highlightFirst?: boolean;
		totalPoints?: number;
		roundsPlayed?: number;
		testid?: string;
		onclick?: (userId: string) => void;
	};

	let {
		userId,
		name,
		rank,
		isCurrentUser = false,
		compact = false,
		showRank = true,
		highlightFirst = true,
		totalPoints,
		roundsPlayed,
		avatarUrl,
		testid,
		onclick,
		children
	}: Props & { children?: import('svelte').Snippet; avatarUrl?: string } = $props();

	const isFirstPlace = $derived(highlightFirst && rank === 1);
	const isTopThree = $derived(rank && rank <= 3);

	function handleClick() {
		onclick?.(userId);
	}

	function getAvatarInitial(n: string) {
		return n ? n.charAt(0).toUpperCase() : '?';
	}
</script>

{#snippet statsSection()}
	{#if totalPoints !== undefined}
		<div class="stats">
			<span class="points">{totalPoints} pts</span>
			{#if roundsPlayed !== undefined}
				<span class="rounds">{roundsPlayed} rds</span>
			{/if}
		</div>
	{/if}
{/snippet}

<div
	class={cn(
		'player-row',
		compact && 'compact',
		isFirstPlace && 'first-place',
		isTopThree && 'top-three',
		onclick && 'interactive'
	)}
	data-testid={testid}
>
	{#if onclick}
		<button
			type="button"
			class="row-action-overlay"
			onclick={handleClick}
			aria-label={`Select ${name}`}
		></button>
	{/if}

	<div class="player-content" aria-hidden={!!onclick}>
		<div class="left">
			<div class="avatar" aria-hidden="true" class:has-image={!!avatarUrl}>
				{#if avatarUrl}
					<img src={avatarUrl} alt={name} class="avatar-img" />
				{:else}
					{getAvatarInitial(name)}
				{/if}
			</div>

			{#if showRank && rank}
				<div class="rank">{rank}</div>
			{/if}

			<div class="meta">
				<div class={cn('name', compact && 'small')}>{name}</div>
				{#if isCurrentUser}
					<div class="you-badge">(You)</div>
				{/if}
			</div>
		</div>

		<div class="right">
			{@render statsSection()}
			{#if children}
				<!-- actions container sits above the overlay -->
				<div class="actions">
					{@render children()}
				</div>
			{/if}
		</div>
	</div>

	{#if isFirstPlace}
		<div class="shine-overlay" aria-hidden="true"></div>
	{/if}
</div>

<style>
	.player-row {
		position: relative;
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 1px solid var(--guild-border);
		background: var(--guild-surface);
		border-radius: 0.5rem;
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.interactive:hover {
		transform: translateX(2px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.row-action-overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		z-index: 2; /* Above content (z1), below actions (z3) */
		padding: 0;
		margin: 0;
	}

	.player-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 0.75rem;
		position: relative;
		z-index: 1; 
		pointer-events: none; /* Let clicks pass through to overlay */
	}
	
	.left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}
	
	.right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.actions {
		position: relative;
		z-index: 3; /* Above overlay */
		pointer-events: auto; /* Re-enable clicks for buttons */
		display: flex;
		align-items: center;
	}

	/* First place special styling - DARK MODE DEFAULT (Obsidian Forest) */
	.player-row.first-place {
		background: linear-gradient(
			135deg,
			rgba(184, 155, 94, 0.2) 0%, /* #B89B5E */
			rgba(124, 107, 60, 0.1) 100% /* #7C6B3C */
		);
		border-color: rgba(184, 155, 94, 0.5);
		box-shadow: 0 0 20px rgba(184, 155, 94, 0.15);
	}

	.player-row.first-place.interactive:hover {
		box-shadow: 0 0 30px rgba(184, 155, 94, 0.25);
		border-color: rgba(184, 155, 94, 0.7);
	}

	@media (prefers-color-scheme: light) {
		.player-row.first-place {
			background: linear-gradient(
				135deg,
				rgba(255, 245, 200, 0.9) 0%,
				rgba(255, 238, 160, 0.85) 50%,
				rgba(255, 245, 200, 0.9) 100%
			);
			border-color: rgba(255, 200, 0, 0.6);
			box-shadow: 0 6px 24px rgba(255, 200, 0, 0.18);
		}

		.player-row.first-place.interactive:hover {
			box-shadow: 0 8px 30px rgba(255, 200, 0, 0.22);
			border-color: rgba(255, 185, 0, 0.7);
		}

		.player-row.first-place .avatar {
			background: linear-gradient(135deg, #ffd700 0%, #ffec60 100%);
			color: #000;
			box-shadow: 0 0 18px rgba(255, 210, 50, 0.6);
		}
	}

	@media (prefers-color-scheme: light) {
		.player-row.first-place .shine-overlay {
			background: linear-gradient(
				90deg,
				transparent 0%,
				rgba(255, 235, 120, 0.9) 45%,
				rgba(255, 235, 120, 0.9) 55%,
				transparent 100%
			);
			animation: shine 2s ease-in-out infinite;
			z-index: 0;
			opacity: 0.35;
			pointer-events: none;
		}
	}

	:global(html:not(.dark)) .player-row.first-place {
		background: linear-gradient(
			135deg,
			rgba(255, 245, 200, 0.9) 0%,
			rgba(255, 238, 160, 0.85) 50%,
			rgba(255, 245, 200, 0.9) 100%
		);
		border-color: rgba(255, 200, 0, 0.6);
		box-shadow: 0 6px 24px rgba(255, 200, 0, 0.18);
	}

	:global(html:not(.dark)) .player-row.first-place.interactive:hover {
		box-shadow: 0 8px 30px rgba(255, 200, 0, 0.22);
		border-color: rgba(255, 185, 0, 0.7);
	}

	:global(html:not(.dark)) .player-row.first-place .avatar {
		background: linear-gradient(135deg, #ffd700 0%, #ffec60 100%);
		color: #000;
		box-shadow: 0 0 18px rgba(255, 210, 50, 0.6);
	}

	:global(html:not(.dark)) .player-row.first-place .shine-overlay {
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 235, 120, 0.95) 48%,
			rgba(255, 235, 120, 0.95) 52%,
			transparent 100%
		);
		animation: shine 2s ease-in-out infinite;
		z-index: 0;
		opacity: 0.35;
		pointer-events: none;
	}

	/* Animated shine effect for first place */
	.shine-overlay {
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.18) 50%,
			transparent 100%
		);
		animation: shine 3s ease-in-out infinite;
		z-index: 0; /* Background effect */
		pointer-events: none;
		opacity: 0.15; /* Subtle in dark mode */
	}

	@keyframes shine {
		0% {
			left: -100%;
		}
		50%,
		100% {
			left: 100%;
		}
	}

	/* Top three subtle glow */
	.player-row.top-three {
		background: rgba(var(--guild-primary-rgb, 0, 116, 116), 0.03);
		border-color: rgba(var(--guild-primary-rgb, 0, 116, 116), 0.15);
	}

	.player-row.compact {
		padding: 0.5rem;
	}

	.avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999px;
		display: inline-grid;
		place-items: center;
		font-weight: 700;
		background: var(--guild-surface-elevated);
		color: var(--guild-text);
		flex-shrink: 0;
		z-index: 4; /* ensure avatar sits above shine */
	}

	.first-place .avatar {
		background: var(--guild-gold-gradient, linear-gradient(135deg, #b89b5e 45%, #7c6b3c 100%));
		color: #ffffff;
		box-shadow: 0 0 15px rgba(184, 155, 94, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.avatar.has-image {
		background: none;
		padding: 0;
		overflow: hidden;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.first-place .avatar.has-image {
		border: 2px solid #b89b5e;
		box-shadow: 0 0 10px rgba(184, 155, 94, 0.4);
	}

	.rank {
		font-weight: 700;
		color: var(--guild-text-secondary);
		min-width: 1.5rem;
		text-align: center;
		font-size: 1rem;
		z-index: 4; /* ensure rank sits above shine */
	}

	.first-place .rank {
		color: var(--guild-accent, #b89b5e);
		font-size: 1.125rem;
		text-shadow: 0 0 15px rgba(184, 155, 94, 0.4);
	}

	.meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 0.125rem;
	}

	.name {
		font-weight: 600;
		color: var(--guild-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.first-place .name {
		font-weight: 700;
		color: var(--guild-text);
	}

	.name.small {
		font-size: 0.875rem;
	}

	.you-badge {
		color: var(--guild-primary);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.stats {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		text-align: right;
		line-height: 1.1;
		gap: 0.25rem;
		white-space: nowrap;
	}

	.points {
		font-family: var(--font-display, 'Fraunces', serif);
		font-weight: 700;
		color: var(--guild-accent, #b89b5e);
		font-size: 1rem;
	}

	.rounds {
		font-family: var(--font-secondary, 'Space Grotesk', sans-serif);
		font-size: 0.75rem;
		color: var(--guild-text-secondary);
		font-weight: 500;
	}

	@media (max-width: 639px) {
		.player-row {
			padding: 0.5rem 0.75rem;
		}
		.avatar {
			width: 2rem;
			height: 2rem;
			font-size: 0.875rem;
		}
		.rank {
			min-width: 1.25rem;
			font-size: 0.875rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shine-overlay {
			animation: none;
		}
		.player-row {
			transition: none;
		}
	}
</style>
