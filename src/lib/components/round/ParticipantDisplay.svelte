<script lang="ts">
	import type { Round } from '$lib/types/backend';

	export let round: Round;
	export let compact: boolean = false;
	export let testid: string | undefined = undefined;

	// map round.status to a CSS class for avatar outlines
	function statusAvatarClass(status: string | undefined) {
		switch (status) {
			case 'active':
				return 'participant-avatar--status-active';
			case 'scheduled':
				return 'participant-avatar--status-scheduled';
			case 'completed':
				return 'participant-avatar--status-completed';
			default:
				return 'participant-avatar--status-default';
		}
	}

	// helpers for responsive avatars
	import { isUnsplashUrl, unsplashSrcset, unsplashSizes } from '$lib/utils/unsplash';
</script>

{#if !compact}
	<div class="space-y-2" data-testid={testid}>
		{#each (round.participants ?? []).slice(0, 4) as participant}
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center space-x-2">
					{#if participant.avatar_url}
						<img
							src={participant.avatar_url}
							alt={participant.username}
							width="24"
							height="24"
							loading="lazy"
							decoding="async"
							crossorigin="anonymous"
							style="aspect-ratio:1/1"
							class="participant-avatar participant-avatar--photo h-6 w-6 flex-shrink-0 rounded-full object-cover {statusAvatarClass(
								round.status
							)}"
							srcset={isUnsplashUrl(participant.avatar_url)
								? unsplashSrcset(participant.avatar_url, [48, 100])
								: undefined}
							sizes={isUnsplashUrl(participant.avatar_url) ? unsplashSizes(24) : undefined}
						/>
					{:else}
						<div
							class="bg-guild-surface-elevated participant-avatar participant-avatar--primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[var(--guild-border)] {statusAvatarClass(
								round.status
							)}"
						>
							<span class="text-xs font-bold text-[var(--guild-text)]"
								>{participant.username.charAt(0).toUpperCase()}</span
							>
						</div>
					{/if}
					<span class="truncate text-[var(--guild-text)]">{participant.username}</span>
				</div>
				{#if participant.score !== undefined && participant.score !== null}
					<span
						class="rounded bg-[var(--guild-primary)]/20 px-2 py-1 text-xs font-semibold text-[var(--guild-primary)]"
					>
						{participant.score}
					</span>
				{:else if round.status === 'active'}
					<span class="text-xs text-[var(--guild-text-secondary)]">-</span>
				{:else}
					<span class="text-xs text-[var(--guild-text-secondary)]">DNP</span>
				{/if}
			</div>
		{/each}
		{#if (round.participants ?? []).length > 4}
			<div class="text-center text-xs font-medium text-[var(--guild-text)]">
				+{(round.participants ?? []).length - 4} more players
			</div>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-between text-sm">
		<div class="flex items-center space-x-2">
			<div class="flex -space-x-1">
				{#each (round.participants ?? []).slice(0, 3) as participant}
					{#if participant.avatar_url}
						<img
							src={participant.avatar_url}
							alt={participant.username}
							width="24"
							height="24"
							loading="lazy"
							decoding="async"
							crossorigin="anonymous"
							style="aspect-ratio:1/1"
							class="participant-avatar participant-avatar--photo h-6 w-6 flex-shrink-0 rounded-full object-cover {statusAvatarClass(
								round.status
							)}"
							srcset={isUnsplashUrl(participant.avatar_url)
								? unsplashSrcset(participant.avatar_url, [48, 100])
								: undefined}
							sizes={isUnsplashUrl(participant.avatar_url) ? unsplashSizes(24) : undefined}
						/>
					{:else}
						<div
							class="bg-guild-surface-elevated participant-avatar participant-avatar--primary flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--guild-primary)] {statusAvatarClass(
								round.status
							)}"
						>
							<span class="text-xs font-bold text-[var(--guild-text)]">
								{participant.username ? participant.username.charAt(0).toUpperCase() : '?'}
							</span>
						</div>
					{/if}
				{/each}
				{#if (round.participants ?? []).length > 3}
					<div
						class="participant-avatar participant-avatar--secondary flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--guild-border)] bg-[var(--guild-secondary)] {statusAvatarClass(
							round.status
						)}"
					>
						<span class="text-xs font-bold text-[var(--guild-text)]"
							>+{(round.participants ?? []).length - 3}</span
						>
					</div>
				{/if}
			</div>
			<span class="ml-2 font-medium text-[var(--guild-text)]">
				{(round.participants ?? []).length} players
			</span>
		</div>
		{#if (round.participants ?? []).some((p) => p.score !== undefined && p.score !== null)}
			<span class="font-medium text-[var(--guild-primary)]">
				{(round.participants ?? []).filter((p) => p.score !== undefined && p.score !== null).length}
				scored
			</span>
		{/if}
	</div>
{/if}
