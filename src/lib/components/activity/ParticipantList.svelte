<script lang="ts">
	import type { ActivityParticipant } from '$lib/discord';

	let { participants }: { participants: ActivityParticipant[] } = $props();

	const MAX_VISIBLE = 5;
	const visible = $derived(participants.slice(0, MAX_VISIBLE));
	const overflow = $derived(participants.length - MAX_VISIBLE);

	function initials(username: string): string {
		return username.slice(0, 2).toUpperCase();
	}

	function avatarUrl(p: ActivityParticipant): string | null {
		if (!p.avatar) return null;
		return `https://cdn.discordapp.com/avatars/${p.discordId}/${p.avatar}.png?size=64`;
	}
</script>

{#if participants.length > 0}
	<div class="flex items-center gap-1.5 border-t border-[--guild-border] px-3 py-2">
		<span class="mr-1 shrink-0 text-xs text-[--guild-text-secondary]">In channel:</span>
		<div class="flex items-center gap-1">
			{#each visible as p (p.discordId)}
				{@const url = avatarUrl(p)}
				<div
					title={p.username}
					class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[--guild-primary] text-[10px] font-bold text-white"
				>
					{#if url}
						<img
							src={url}
							alt={p.username}
							class="h-full w-full object-cover"
							onerror={(e) => {
								(e.currentTarget as HTMLImageElement).style.display = 'none';
							}}
						/>
					{:else}
						{initials(p.username)}
					{/if}
				</div>
			{/each}
			{#if overflow > 0}
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-[--guild-text-secondary]"
				>
					+{overflow}
				</div>
			{/if}
		</div>
	</div>
{/if}
