<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		userId: string;
		name: string;
		rank?: number;
		score?: number | null;
		isCurrentUser?: boolean;
		isTopThree?: boolean;
		compact?: boolean;
		showRank?: boolean;
		testid?: string;
		onClick?: (userId: string) => void;
		[key: string]: any;
	};

	let {
		userId,
		name,
		rank,
		score = undefined,
		isCurrentUser = false,
		isTopThree = false,
		compact = false,
		showRank = true,
		testid,
		onClick,
		...rest
	}: Props = $props();

	function getMedalEmoji(r?: number) {
		if (!r) return '';
		switch (r) {
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

	function getAvatarInitial(n: string) {
		return n ? n.charAt(0).toUpperCase() : '?';
	}

	function getRankBg(r?: number) {
		switch (r) {
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

	function getRankGlow(r?: number) {
		switch (r) {
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

	function handleClick() {
		if (onClick) onClick(userId);
	}
</script>

{#if onClick}
	<button
		type="button"
		class={cn(
			'group relative flex items-center justify-between overflow-hidden rounded-lg transition-all duration-300',
			getRankGlow(rank),
			getRankBg(rank),
			isCurrentUser ? 'bg-guild-primary/10' : ''
		)}
		style={`border: 1px solid var(--guild-border); padding: ${compact ? '0.5rem 0.75rem' : '0.75rem 1rem'}`}
		onclick={handleClick}
		data-testid={testid}
		{...rest}
	>
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center">
				<div
					class={cn(
						'bg-guild-surface-elevated text-guild-text flex items-center justify-center rounded-full font-bold',
						rank === 1
							? 'h-10 w-10 text-lg shadow-[0_10px_40px_rgba(2,6,23,0.08)]'
							: 'h-8 w-8 text-sm'
					)}
				>
					<span aria-hidden="true">{getAvatarInitial(name)}</span>
				</div>
			</div>

			{#if showRank && rank}
				<div class="flex min-w-6 items-center">
					<span
						class={compact
							? 'text-guild-text text-sm font-bold'
							: rank === 1
								? 'font-secondary text-guild-gold-gradient text-3xl leading-none font-bold'
								: 'text-guild-text-secondary text-lg font-bold'}
					>
						{rank}
					</span>
				</div>
			{/if}

			<div class="flex items-center gap-2">
				{#if isCurrentUser}
					<div class="bg-guild-primary h-2 w-2 rounded-full" aria-hidden="true"></div>
				{/if}

				<span
					class={cn(
						'text-guild-text',
						compact ? 'text-sm' : 'font-medium',
						isTopThree ? 'font-semibold' : '',
						rank === 1 ? 'font-secondary text-guild-gold-gradient text-lg' : ''
					)}
				>
					{name}
				</span>

				{#if rank && rank <= 3}
					<span
						class={cn('rank-medal', rank === 1 ? 'top1-medal play-burst' : '')}
						aria-hidden="true"
						title={`Top ${rank}`}
					>
						{getMedalEmoji(rank)}
					</span>
				{/if}

				{#if isCurrentUser}
					<span class="text-guild-primary text-xs font-medium">(You)</span>
				{/if}
			</div>
		</div>

		<div class="flex min-w-12 items-center justify-end" aria-hidden="true">{score ?? ''}</div>
	</button>
{:else}
	<div
		class={cn(
			'group relative flex items-center justify-between overflow-hidden rounded-lg transition-all duration-300',
			getRankGlow(rank),
			getRankBg(rank),
			isCurrentUser ? 'bg-guild-primary/10' : ''
		)}
		style={`border: 1px solid var(--guild-border); padding: ${compact ? '0.5rem 0.75rem' : '0.75rem 1rem'}`}
		data-testid={testid}
		{...rest}
	>
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center">
				<div
					class={cn(
						'bg-guild-surface-elevated text-guild-text flex items-center justify-center rounded-full font-bold',
						rank === 1
							? 'h-10 w-10 text-lg shadow-[0_10px_40px_rgba(2,6,23,0.08)]'
							: 'h-8 w-8 text-sm'
					)}
				>
					<span aria-hidden="true">{getAvatarInitial(name)}</span>
				</div>
			</div>

			{#if showRank && rank}
				<div class="flex min-w-6 items-center">
					<span
						class={compact
							? 'text-guild-text text-sm font-bold'
							: rank === 1
								? 'font-secondary text-guild-gold-gradient text-3xl leading-none font-bold'
								: 'text-guild-text-secondary text-lg font-bold'}
					>
						{rank}
					</span>
				</div>
			{/if}

			<div class="flex items-center gap-2">
				{#if isCurrentUser}
					<div class="bg-guild-primary h-2 w-2 rounded-full" aria-hidden="true"></div>
				{/if}

				<span
					class={cn(
						'text-guild-text',
						compact ? 'text-sm' : 'font-medium',
						isTopThree ? 'font-semibold' : '',
						rank === 1 ? 'font-secondary text-guild-gold-gradient text-lg' : ''
					)}
				>
					{name}
				</span>

				{#if rank && rank <= 3}
					<span
						class={cn('rank-medal', rank === 1 ? 'top1-medal play-burst' : '')}
						aria-hidden="true"
						title={`Top ${rank}`}
					>
						{getMedalEmoji(rank)}
					</span>
				{/if}

				{#if isCurrentUser}
					<span class="text-guild-primary text-xs font-medium">(You)</span>
				{/if}
			</div>
		</div>

		<div class="flex min-w-12 items-center justify-end" aria-hidden="true">{score ?? ''}</div>
	</div>
{/if}

<style>
	.rank-medal {
		font-size: 1.1rem;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		vertical-align: middle;
	}

	.top1-medal {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		filter: drop-shadow(0 8px 18px rgba(2, 6, 23, 0.08));
	}
</style>
