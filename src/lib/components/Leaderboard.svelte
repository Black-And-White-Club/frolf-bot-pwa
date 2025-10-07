<script lang="ts">
	import type { LeaderboardData } from '$lib/types/backend';

	interface Props {
		entries?: LeaderboardData;
		limit?: number;
		showRank?: boolean;
		compact?: boolean;
		testid?: string;
		showViewAll?: boolean;
		onViewAll?: () => void;
		minViewAllCount?: number;
		variant?: 'refined' | 'minimal';
	}

	let {
		entries = [],
		limit = undefined,
		showRank = true,
		compact = false,
		testid = undefined,
		showViewAll = false,
		onViewAll = undefined,
		minViewAllCount = 5,
		variant = 'refined'
	}: Props = $props();

	// Derived state with $derived.by for better memoization
	const displayEntries = $derived.by(() =>
		entries.slice(0, limit || entries.length).map((entry, index) => ({
			rank: showRank ? index + 1 : undefined,
			name: `Player #${entry.tag_number}`,
			tag: entry.tag_number,
			userId: entry.user_id,
			isCurrentUser: false,
			isTopThree: index < 3
		}))
	);

	// Helper functions - pure functions outside of reactive context
	function getRankGlow(rank: number): string {
		switch (rank) {
			case 1:
				return 'shadow-lg ring-1 ring-accent-300/15';
			case 2:
				return 'shadow-lg shadow-secondary-500/15 ring-1 ring-secondary-500/10';
			case 3:
				return 'shadow-md shadow-primary-500/10 ring-1 ring-primary-500/10';
			default:
				return '';
		}
	}

	function getRankBorder(rank: number): string {
		switch (rank) {
			case 1:
				return 'border-accent-400 ring-2 ring-accent-500/20';
			case 2:
				return 'border-secondary-300';
			case 3:
				return 'border-primary-300';
			default:
				return 'border-[var(--guild-border)]';
		}
	}

	function getRankBg(rank: number): string {
		switch (rank) {
			case 1:
				return 'bg-gradient-to-r from-accent-50 via-accent-100 to-accent-50 dark:from-accent-900/40 dark:via-accent-800/30 dark:to-accent-900/40';
			case 2:
				return 'bg-secondary-50/60 dark:bg-secondary-900/25';
			case 3:
				return 'bg-primary-50/60 dark:bg-primary-900/25';
			default:
				return 'bg-guild-surface';
		}
	}

	function getMedalEmoji(rank: number | undefined): string {
		if (!rank) return '';
		switch (rank) {
			case 1:
				return '🥇';
			case 2:
				return '🥈';
			case 3:
				return '🥉';
			default:
				return '';
		}
	}

	function getAvatarInitial(name: string): string {
		return name ? name.charAt(0).toUpperCase() : '?';
	}
</script>

<div class="relative space-y-2" data-testid={testid}>
	<!-- Background SVG effects -->
	{#if variant === 'refined'}
		<svg
			class="pointer-events-none absolute inset-0 -z-20 h-full w-full"
			aria-hidden="true"
			preserveAspectRatio="none"
		>
			<defs>
				<radialGradient id={`lb-spot-${testid ?? 'default'}`} cx="50%" cy="18%" r="60%">
					<stop offset="0%" stop-color="rgba(255,244,214,0.12)" />
					<stop offset="40%" stop-color="rgba(255,244,214,0.06)" />
					<stop offset="100%" stop-color="rgba(255,244,214,0)" />
				</radialGradient>
				<filter id={`micro-noise-${testid ?? 'default'}`}>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="1.2"
						numOctaves="1"
						stitchTiles="stitch"
						result="t"
					/>
					<feColorMatrix type="saturate" values="0" />
					<feComponentTransfer>
						<feFuncA type="table" tableValues="0 0.06" />
					</feComponentTransfer>
				</filter>
			</defs>
			<rect
				class="lb-spot-rect"
				width="100%"
				height="100%"
				fill={`url(#lb-spot-${testid ?? 'default'})`}
			/>
			<rect
				width="100%"
				height="100%"
				fill="rgba(0,0,0,0)"
				style={`filter:url(#micro-noise-${testid ?? 'default'}); opacity:0.035`}
			/>
		</svg>
	{:else}
		<svg
			class="pointer-events-none absolute inset-0 -z-20 h-full w-full"
			aria-hidden="true"
			preserveAspectRatio="none"
		>
			<defs>
				<linearGradient id={`glass-grad-${testid ?? 'default'}`} x1="0" x2="1">
					<stop offset="0%" stop-color="rgba(255,255,255,0.03)" />
					<stop offset="100%" stop-color="rgba(255,255,255,0.01)" />
				</linearGradient>
				<filter id={`soft-blur-${testid ?? 'default'}`}>
					<feGaussianBlur stdDeviation="18" result="b" />
				</filter>
			</defs>
			<rect
				class="lb-spot-rect"
				width="100%"
				height="100%"
				fill={`url(#glass-grad-${testid ?? 'default'})`}
			/>
			<rect
				x="6%"
				y="4%"
				width="88%"
				height="36%"
				rx="24"
				fill="rgba(255,255,255,0.02)"
				style={`filter:url(#soft-blur-${testid ?? 'default'})`}
			/>
		</svg>
	{/if}

	{#if displayEntries.length === 0}
		<p class="text-guild-text-secondary py-4 text-center text-sm">No players yet.</p>
	{:else}
		{#each displayEntries as player (player.userId)}
			<div
				class={`group relative flex items-center justify-between overflow-hidden rounded-lg transition-all duration-300 ${
					player.isTopThree ? getRankGlow(player.rank || 0) : ''
				} ${getRankBg(player.rank || 0)} ${player.isCurrentUser ? 'bg-guild-primary/10' : ''}`}
				style={`border: 1px solid var(--guild-border); padding: ${compact ? '0.5rem 0.75rem' : '0.75rem 1rem'}`}
				data-testid={`leaderboard-row-${player.userId}`}
			>
				<!-- Left side: Avatar + Rank + Name -->
				<div class="flex items-center gap-3">
					<!-- Avatar with fixed container for consistent alignment -->
					<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center">
						<div
							class={`bg-guild-surface-elevated text-guild-text flex items-center justify-center rounded-full font-bold ${
								player.rank === 1
									? 'h-10 w-10 text-lg shadow-[0_10px_40px_rgba(2,6,23,0.08)]'
									: 'h-8 w-8 text-sm'
							}`}
						>
							<span aria-hidden="true">{getAvatarInitial(player.name)}</span>
						</div>
					</div>

					<!-- Rank number -->
					{#if showRank && player.rank}
						<div class="flex min-w-6 items-center">
							<span
								class={compact
									? 'text-guild-text text-sm font-bold'
									: player.rank === 1
										? 'font-secondary text-guild-gold-gradient text-3xl leading-none font-bold'
										: 'text-guild-text-secondary text-lg font-bold'}
							>
								{player.rank}
							</span>
						</div>
					{/if}

					<!-- Name + Medal + Current User indicator -->
					<div class="flex items-center gap-2">
						{#if player.isCurrentUser}
							<div class="bg-guild-primary h-2 w-2 rounded-full" aria-hidden="true"></div>
						{/if}

						<span
							class={`text-guild-text ${compact ? 'text-sm' : 'font-medium'} ${
								player.isTopThree ? 'font-semibold' : ''
							} ${player.rank === 1 ? 'font-secondary text-guild-gold-gradient text-lg' : ''}`}
						>
							{player.name}
						</span>

						{#if player.rank && player.rank <= 3}
							<span
								class={`rank-medal ${player.rank === 1 ? 'top1-medal play-burst' : ''}`}
								aria-hidden="true"
								title={`Top ${player.rank}`}
							>
								{getMedalEmoji(player.rank)}
							</span>
						{/if}

						{#if player.isCurrentUser}
							<span class="text-guild-primary text-xs font-medium">(You)</span>
						{/if}
					</div>
				</div>

				<!-- Right side: Optional score/stats placeholder -->
				<div class="flex min-w-12 items-center justify-end" aria-hidden="true"></div>
			</div>
		{/each}

		<!-- View All button (if needed) -->
		{#if showViewAll && entries.length > minViewAllCount && onViewAll}
			<button
				onclick={onViewAll}
				class="border-guild-border bg-guild-surface text-guild-text hover:bg-guild-surface-elevated mt-2 w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
				type="button"
			>
				View All Players ({entries.length})
			</button>
		{/if}
	{/if}
</div>

<style>
	/* Entry animation with reduced motion support */
	@keyframes lb-entry {
		from {
			transform: translateY(-4px) scale(0.995);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.group {
			animation: lb-entry 420ms cubic-bezier(0.2, 0.9, 0.24, 1) both;
		}
	}

	/* Top 1 medal burst animation */
	@keyframes medal-burst {
		0% {
			transform: translateY(0) scale(0.96);
			opacity: 0;
		}
		40% {
			transform: translateY(-6px) scale(1.03);
			opacity: 1;
		}
		100% {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.play-burst {
			animation: medal-burst 820ms cubic-bezier(0.2, 0.9, 0.24, 1) both;
		}
	}

	/* Medal styling */
	.top1-medal {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		filter: drop-shadow(0 8px 18px rgba(2, 6, 23, 0.08));
	}

	.rank-medal {
		font-size: 1.1rem;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		vertical-align: middle;
	}

	/* Subtle background pan animation */
	@keyframes bg-pan {
		0%,
		100% {
			transform: translateX(-4%);
		}
		50% {
			transform: translateX(4%);
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.lb-spot-rect {
			animation: bg-pan 12s linear infinite;
		}
	}
</style>
