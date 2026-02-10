<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		userId: string;
		name: string;
		rank?: number;
		isCurrentUser?: boolean;
		compact?: boolean;
		showRank?: boolean;
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
		totalPoints,
		roundsPlayed,
		testid,
		onclick
	}: Props = $props();

	const isFirstPlace = $derived(rank === 1);
	const isTopThree = $derived(rank && rank <= 3);

	function handleClick() {
		onclick?.(userId);
	}

	function getAvatarInitial(n: string) {
		return n ? n.charAt(0).toUpperCase() : '?';
	}

	function getMedalEmoji(r?: number) {
		if (!r) return '';
		return r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '';
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

{#if onclick}
	<button
		type="button"
		class={cn(
			'player-row',
			compact && 'compact',
			isFirstPlace && 'first-place',
			isTopThree && 'top-three'
		)}
		onclick={handleClick}
		data-testid={testid}
	>
		<div class="player-content">
			<div class="left">
				<div class="avatar" aria-hidden="true">
					{getAvatarInitial(name)}
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
				{#if isTopThree}
					<span
						class="medal"
						class:gold={rank === 1}
						class:silver={rank === 2}
						class:bronze={rank === 3}
					>
						{getMedalEmoji(rank)}
					</span>
				{/if}
			</div>
		</div>

		{#if isFirstPlace}
			<div class="shine-overlay" aria-hidden="true"></div>
		{/if}
	</button>
{:else}
	<div
		class={cn(
			'player-row',
			compact && 'compact',
			isFirstPlace && 'first-place',
			isTopThree && 'top-three'
		)}
		data-testid={testid}
	>
		<div class="player-content">
			<div class="left">
				<div class="avatar" aria-hidden="true">
					{getAvatarInitial(name)}
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
				{#if isTopThree}
					<span
						class="medal"
						class:gold={rank === 1}
						class:silver={rank === 2}
						class:bronze={rank === 3}
					>
						{getMedalEmoji(rank)}
					</span>
				{/if}
			</div>
		</div>

		{#if isFirstPlace}
			<div class="shine-overlay" aria-hidden="true"></div>
		{/if}
	</div>
{/if}

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

	.player-row:is(button) {
		width: 100%;
		text-align: left;
		cursor: pointer;
	}

	.player-row:is(button):hover {
		transform: translateX(2px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.player-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 0.75rem;
		position: relative;
		z-index: 3; /* bring content above the shine overlay */
	}

	/* First place special styling */
	.player-row.first-place {
		background: linear-gradient(
			135deg,
			rgba(255, 215, 0, 0.08) 0%,
			rgba(255, 223, 77, 0.05) 50%,
			rgba(255, 215, 0, 0.08) 100%
		);
		border-color: rgba(255, 215, 0, 0.3);
		box-shadow: 0 0 20px rgba(255, 215, 0, 0.15);
	}

	.player-row.first-place:is(button):hover {
		box-shadow: 0 0 30px rgba(255, 215, 0, 0.25);
		border-color: rgba(255, 215, 0, 0.5);
	}

	/* Make first-place more visible in light color schemes while keeping
	 the current dark-mode appearance untouched. This targets only light
	 mode so we don't change the dark styling you already like. */
	@media (prefers-color-scheme: light) {
		.player-row.first-place {
			/* brighter, warmer background and stronger glow */
			background: linear-gradient(
				135deg,
				rgba(255, 245, 200, 0.9) 0%,
				rgba(255, 238, 160, 0.85) 50%,
				rgba(255, 245, 200, 0.9) 100%
			);
			border-color: rgba(255, 200, 0, 0.6);
			box-shadow: 0 6px 24px rgba(255, 200, 0, 0.18);
		}

		.player-row.first-place:is(button):hover {
			box-shadow: 0 8px 30px rgba(255, 200, 0, 0.22);
			border-color: rgba(255, 185, 0, 0.7);
		}

		.player-row.first-place .avatar {
			background: linear-gradient(135deg, #ffd700 0%, #ffec60 100%);
			color: #000;
			box-shadow: 0 0 18px rgba(255, 210, 50, 0.6);
		}
	}

	/* Make the shine overlay more visible in light mode: use a warm gold
		 band, increase contrast and speed slightly, and ensure it sits above
		 the content so the effect is noticeable. */
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
			/* keep the overlay visually above background but below the content
					 so it doesn't obscure the rank/avatars */
			z-index: 0;
			opacity: 0.35;
			pointer-events: none;
		}
	}

	/* If the app toggles theme via an HTML class ('.dark'), apply the same
	 enhanced first-place styling when the page is in light-theme mode
	 (i.e., html does NOT have the .dark class). This covers stored user
	 preferences and theme toggles that don't change system-level media.
*/
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

	:global(html:not(.dark)) .player-row.first-place:is(button):hover {
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
		z-index: 0; /* ensure content (z-index:1) remains above the shine */
		opacity: 0.35;
		pointer-events: none;
	}

	:global(html:not(.dark)) .player-row.first-place .rank {
		/* Make the rank number clearly visible on light backgrounds: small
			 gold pill with white text and subtle shadow for contrast. */
		display: inline-block;
		background: #ffd700;
		color: #fff;
		padding: 0.06rem 0.45rem;
		border-radius: 9999px;
		font-weight: 800;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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
		/* place overlay above background but below rank/avatar (we'll raise
		   rank/avatar z-index) so the shine is visible but doesn't obscure
		   the important UI elements */
		z-index: 2;
		pointer-events: none;
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

	.left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
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
		background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
		color: #000;
		box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
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
		color: #ffd700;
		font-size: 1.125rem;
		text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
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

	.right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.stats {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		text-align: right;
		line-height: 1.1;
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

	.medal {
		font-size: 1.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}

	.medal.gold {
		animation: pulse-gold 2s ease-in-out infinite;
	}

	@keyframes pulse-gold {
		0%,
		100% {
			transform: scale(1);
			filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
		}
		50% {
			transform: scale(1.1);
			filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.5));
		}
	}

	.medal.silver {
		opacity: 0.95;
	}

	.medal.bronze {
		opacity: 0.9;
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
		.medal {
			font-size: 1.25rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shine-overlay {
			animation: none;
		}
		.medal.gold {
			animation: none;
		}
		.player-row {
			transition: none;
		}
	}
</style>
