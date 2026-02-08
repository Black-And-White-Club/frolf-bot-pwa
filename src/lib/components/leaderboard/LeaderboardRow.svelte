<script lang="ts">
    import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
    import { leaderboardService } from '$lib/stores/leaderboard.svelte';
    import { userProfiles } from '$lib/stores/userProfiles.svelte';
    import ParticipantAvatar from '$lib/components/round/ParticipantAvatar.svelte';
    import MovementIndicator from './MovementIndicator.svelte';

    let { entry, rank }: { entry: LeaderboardEntry; rank: number } = $props();

    let tagStyle = $derived(
        rank === 1
            ? 'bg-guild-gold-gradient text-white font-bold shadow-lg shadow-amber-900/20'
            : rank === 2
                ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black font-bold shadow-lg shadow-slate-400/30'
                : rank === 3
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-black font-bold shadow-lg shadow-amber-700/30'
                    : rank <= 10
                        ? 'bg-sage-600 text-white'
                        : 'bg-slate-700 text-slate-200'
    );

    let movement = $derived(leaderboardService.getMovementIndicator(entry));
    let displayName = $derived(userProfiles.getDisplayName(entry.userId));
</script>

<div class="hover:bg-forest-800/50 flex items-center gap-4 rounded-lg p-3 transition-colors">
    <!-- Tag Number Badge -->
    <div class={`flex h-10 w-10 items-center justify-center rounded-full ${tagStyle}`}>
        {entry.tagNumber}
    </div>

    <!-- Avatar -->
    <ParticipantAvatar 
        userId={entry.userId} 
        username={displayName} 
        size={32} 
    />

    <!-- Player Info -->
    <div class="flex flex-1 items-center gap-3">
        <span class="font-medium">{displayName}</span>
    </div>

    <!-- Movement Indicator -->
    <MovementIndicator {entry} {movement} />
</div>
