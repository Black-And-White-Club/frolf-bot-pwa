<script lang="ts">
	import type { LeaderboardData } from '$lib/types/backend';
	// no default castle/sprite assets needed when using the simple medal emoji

	export let entries: LeaderboardData = [];
	export let limit: number | undefined = undefined;
	export let showRank: boolean = true;
	export let compact: boolean = false;
	export let testid: string | undefined = undefined;
	export let showViewAll: boolean = false;
	export let onViewAll: (() => void) | undefined = undefined;
	export let minViewAllCount: number = 5;
	export let variant: 'refined' | 'minimal' = 'refined';

	// Use emoji medals for a simpler, more familiar look

	$: displayEntries = entries.slice(0, limit || entries.length).map((entry, index) => ({
		rank: showRank ? index + 1 : undefined,
		name: `Player #${entry.tag_number}`,
		tag: entry.tag_number,
		userId: entry.user_id,
		isCurrentUser: false,
		isTopThree: index < 3
	}));

	// Ensure exported but currently-unused props are referenced so Svelte doesn't error
	$: _consumeProps = { showViewAll, onViewAll, minViewAllCount };
	// no sprite reactive refs required

	function getRankGlow(rank: number) {
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

	function getRankBorder(rank: number) {
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

	function getRankBg(rank: number) {
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

	function getMedalEmoji(rank: number | undefined) {
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
</script>

<div class="relative space-y-2" data-testid={testid}>
	{#if variant === 'refined'}
		<svg
			class="pointer-events-none absolute inset-0 -z-20 h-full w-full"
			aria-hidden="true"
			preserveAspectRatio="none"
		>
			<defs>
				<radialGradient id="lb-spot" cx="50%" cy="18%" r="60%">
					<stop offset="0%" stop-color="rgba(255,244,214,0.12)" />
					<stop offset="40%" stop-color="rgba(255,244,214,0.06)" />
					<stop offset="100%" stop-color="rgba(255,244,214,0)" />
				</radialGradient>
				<filter id="micro-noise">
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
			<rect width="100%" height="100%" fill="url(#lb-spot)" />
			<rect
				width="100%"
				height="100%"
				fill="rgba(0,0,0,0)"
				style="filter:url(#micro-noise); opacity:0.035"
			/>
		</svg>
	{:else}
		<svg
			class="pointer-events-none absolute inset-0 -z-20 h-full w-full"
			aria-hidden="true"
			preserveAspectRatio="none"
		>
			<defs>
				<linearGradient id="glassGrad" x1="0" x2="1">
					<stop offset="0%" stop-color="rgba(255,255,255,0.03)" />
					<stop offset="100%" stop-color="rgba(255,255,255,0.01)" />
				</linearGradient>
				<filter id="soft-blur">
					<feGaussianBlur stdDeviation="18" result="b" />
				</filter>
			</defs>
			<rect width="100%" height="100%" fill="url(#glassGrad)" />
			<rect
				x="6%"
				y="4%"
				width="88%"
				height="36%"
				rx="24"
				fill="rgba(255,255,255,0.02)"
				filter="url(#soft-blur)"
			/>
		</svg>
	{/if}

	{#if displayEntries.length === 0}
		<p class="py-4 text-center text-sm text-[var(--guild-text-secondary)]">No players yet.</p>
	{:else}
		{#each displayEntries as player}
			<div
				class="flex items-center justify-between {compact ? 'px-3 py-2' : 'px-4 py-3'} {getRankBg(
					player.rank || 0
				)} rounded-lg border {getRankBorder(player.rank || 0)} {player.isTopThree
					? getRankGlow(player.rank || 0)
					: ''} {player.isCurrentUser
					? 'border-[var(--guild-primary)] bg-[var(--guild-primary)]/10'
					: ''} relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
				data-testid={`leaderboard-row-${player.userId}`}
			>
				<div class="flex items-center">
					<div class="mr-3 flex items-center">
						<!-- Avatar container fixed to the largest avatar size so row alignment stays consistent -->
						<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center">
							{#if player.rank === 1}
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--guild-surface-elevated)] text-lg font-bold text-[var(--guild-text)]"
									style="box-shadow: 0 10px 40px rgba(2,6,23,0.08); border-radius:9999px;"
								>
									<span aria-hidden="true"
										>{player.name ? player.name.charAt(0).toUpperCase() : '?'}</span
									>
								</div>
							{:else}
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--guild-surface-elevated)] text-sm font-bold text-[var(--guild-text)]"
								>
									<span aria-hidden="true"
										>{player.name ? player.name.charAt(0).toUpperCase() : '?'}</span
									>
								</div>
							{/if}
						</div>
					</div>

					{#if showRank && player.rank}
						<div class="mr-3 flex min-w-[1.5rem] items-center">
							<span
								class={` ${compact ? 'text-sm font-bold text-[var(--guild-text)]' : player.rank === 1 ? 'font-secondary text-guild-gold-gradient text-3xl leading-none font-bold' : 'text-lg font-bold text-[var(--guild-text-secondary)]'} self-center`}
								>{player.rank}</span
							>
						</div>
					{/if}

					<div class="flex items-center">
						{#if player.isCurrentUser}
							<div class="mr-2 h-2 w-2 rounded-full bg-[var(--guild-primary)]"></div>
						{/if}

						{#if player.rank === 1}
							<div class="flex items-center space-x-2">
								<span class="font-secondary text-guild-gold-gradient text-lg font-semibold"
									>{player.name}</span
								>
								<span class="rank-medal top1-medal play-burst ml-3" aria-hidden="true" title="Top 1"
									>{getMedalEmoji(player.rank)}</span
								>
							</div>
						{:else}
							<div class="flex items-center space-x-2">
								<span
									class="text-[var(--guild-text)] {compact
										? 'text-sm'
										: 'font-medium'} {player.isTopThree ? 'font-semibold' : ''}">{player.name}</span
								>
								{#if player.rank && player.rank <= 3}
									<span class="rank-medal ml-1" aria-hidden="true"
										>{getMedalEmoji(player.rank)}</span
									>
								{/if}
							</div>
						{/if}

						{#if player.isCurrentUser}
							<span class="ml-2 text-xs font-medium text-[var(--guild-primary)]">(You)</span>
						{/if}
					</div>
				</div>

				<div class="flex items-center" style="min-width:3rem"></div>
			</div>
		{/each}
	{/if}
</div>

<style>
	/* entry animation */
	.animate-leaderboard-entry {
		animation: lb-entry 420ms cubic-bezier(0.2, 0.9, 0.24, 1) both;
	}

	@keyframes lb-entry {
		0% {
			transform: translateY(-4px) scale(0.995);
			opacity: 0;
		}
		100% {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-leaderboard-entry {
			animation: none;
		}
	}

	/* burst animation used on the top-1 medal */
	.play-burst {
		animation: medal-burst 820ms cubic-bezier(0.2, 0.9, 0.24, 1) both;
	}

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

	@media (prefers-reduced-motion: reduce) {
		.play-burst {
			animation: none !important;
		}
	}

	/* simple medal wrapper */
	.top1-medal {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		vertical-align: middle;
		filter: drop-shadow(0 8px 18px rgba(2, 6, 23, 0.08));
	}

	.rank-medal {
		font-size: 1.1rem;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	/* ensure medals align vertically with the player's name */
	.rank-medal,
	.top1-medal {
		vertical-align: middle;
	}

	/* subtle background pan for the radial spot */
	svg[aria-hidden='true'] rect[fill^='url(#lb-spot)'] {
		animation: bg-pan 12s linear infinite;
	}
	@keyframes bg-pan {
		0% {
			transform: translateX(-4%);
		}
		50% {
			transform: translateX(4%);
		}
		100% {
			transform: translateX(-4%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		svg[aria-hidden='true'] rect[fill^='url(#lb-spot)'] {
			animation: none !important;
		}
	}
</style>
