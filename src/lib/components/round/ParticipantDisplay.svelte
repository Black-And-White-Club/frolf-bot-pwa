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
</script>

{#if !compact}
	<div class="space-y-2" data-testid={testid}>
		{#each round.participants.slice(0, 4) as participant}
			<div class="flex justify-between items-center text-sm">
				<div class="flex items-center space-x-2">
					{#if participant.avatar_url}
						<img src={participant.avatar_url} alt={participant.username} class="w-6 h-6 rounded-full object-cover flex-shrink-0 participant-avatar participant-avatar--photo {statusAvatarClass(round.status)}" />
					{:else}
						<div class="w-6 h-6 rounded-full bg-guild-surface-elevated border border-[var(--guild-border)] flex items-center justify-center flex-shrink-0 participant-avatar participant-avatar--primary {statusAvatarClass(round.status)}">
							<span class="text-[var(--guild-text)] font-bold text-xs">{participant.username.charAt(0).toUpperCase()}</span>
						</div>
					{/if}
					<span class="text-[var(--guild-text)] truncate">{participant.username}</span>
				</div>
				{#if participant.score !== undefined && participant.score !== null}
					<span class="font-semibold text-[var(--guild-primary)] bg-[var(--guild-primary)]/20 px-2 py-1 rounded text-xs">
						{participant.score}
					</span>
				{:else if round.status === 'active'}
					<span class="text-[var(--guild-text-secondary)] text-xs">-</span>
				{:else}
					<span class="text-[var(--guild-text-secondary)] text-xs">DNP</span>
				{/if}
			</div>
		{/each}
		{#if round.participants.length > 4}
			<div class="text-xs text-[var(--guild-text)] text-center font-medium">
				+{round.participants.length - 4} more players
			</div>
		{/if}
	</div>
{:else}
	<div class="flex justify-between items-center text-sm">
		<div class="flex items-center space-x-2">
			<div class="flex -space-x-1">
				{#each round.participants.slice(0, 3) as participant}
							{#if participant.avatar_url}
								<img src={participant.avatar_url} alt={participant.username} class="w-6 h-6 rounded-full object-cover flex-shrink-0 participant-avatar participant-avatar--photo {statusAvatarClass(round.status)}" />
							{:else}
								<div class="w-6 h-6 rounded-full bg-guild-surface-elevated border-2 border-[var(--guild-primary)] flex items-center justify-center participant-avatar participant-avatar--primary {statusAvatarClass(round.status)}">
									<span class="text-[var(--guild-text)] font-bold text-xs">
										{participant.username ? participant.username.charAt(0).toUpperCase() : '?'}
									</span>
								</div>
							{/if}
				{/each}
				{#if round.participants.length > 3}
							<div class="w-6 h-6 rounded-full bg-[var(--guild-secondary)] border-2 border-[var(--guild-border)] flex items-center justify-center participant-avatar participant-avatar--secondary {statusAvatarClass(round.status)}">
								<span class="text-[var(--guild-text)] font-bold text-xs">+{round.participants.length - 3}</span>
							</div>
				{/if}
			</div>
				<span class="text-[var(--guild-text)] ml-2 font-medium">
				{round.participants.length} players
			</span>
		</div>
		{#if round.participants.some(p => p.score !== undefined && p.score !== null)}
			<span class="text-[var(--guild-primary)] font-medium">
				{round.participants.filter(p => p.score !== undefined && p.score !== null).length} scored
			</span>
		{/if}
	</div>
{/if}
