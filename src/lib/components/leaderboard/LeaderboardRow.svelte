<script lang="ts">
    import type { LeaderboardEntry } from '$lib/stores/leaderboard.svelte';
    import { leaderboardService } from '$lib/stores/leaderboard.svelte';
    import { userProfiles } from '$lib/stores/userProfiles.svelte';
    import ParticipantAvatar from '$lib/components/round/ParticipantAvatar.svelte';
    import MovementIndicator from './MovementIndicator.svelte';

    const { entry, rank } = $props<{ entry: LeaderboardEntry; rank: number }>();

    const tagStyle = $derived(
        rank === 1
            ? 'bg-guild-gold-gradient text-black font-bold shadow-lg shadow-guild-accent/30'
            : rank === 2
                ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black font-bold shadow-lg shadow-slate-400/30'
                : rank === 3
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-black font-bold shadow-lg shadow-amber-700/30'
                    : rank <= 10
                        ? 'bg-sage-600 text-white'
                        : 'bg-slate-700 text-slate-200'
    );

    const movement = $derived(leaderboardService.getMovementIndicator(entry));
    const displayName = $derived(userProfiles.getDisplayName(entry.userId));
    const isSeasonMode = $derived(leaderboardService.viewMode === 'season');
</script>

<div class="hover:bg-liquid-skobeloff flex items-center gap-4 rounded-lg p-3 transition-colors duration-200">
    <!-- Tag Number/Rank Badge -->
    <div class={`flex h-10 w-10 items-center justify-center rounded-full ${tagStyle}`}>
        {isSeasonMode ? rank : entry.tagNumber}
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

    <!-- Stats -->
    <div class="mr-4 flex flex-col items-end">
         <div class="font-display text-sm font-bold text-guild-accent">{entry.totalPoints} pts</div>
         <div class="font-secondary text-xs text-guild-text-secondary">{entry.roundsPlayed} rds</div>
    </div>

    <!-- Movement Indicator -->
    <MovementIndicator {entry} {movement} />
</div>
