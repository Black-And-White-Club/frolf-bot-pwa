<script lang="ts">
	type TopTab = 'round_winner' | 'placement' | 'over_under';
	type PlacementSub = 'placement_2nd' | 'placement_3rd' | 'placement_last';

	let {
		selectedTab = $bindable<TopTab>('round_winner'),
		selectedPlacementSub = $bindable<PlacementSub>('placement_2nd'),
		hasWinner,
		hasPlacement,
		hasOverUnder
	}: {
		selectedTab: TopTab;
		selectedPlacementSub: PlacementSub;
		hasWinner: boolean;
		hasPlacement: boolean;
		hasOverUnder: boolean;
	} = $props();

	const tabs: { key: TopTab; label: string; enabled: boolean }[] = $derived([
		{ key: 'round_winner', label: 'Winner', enabled: hasWinner },
		{ key: 'placement', label: 'Placement', enabled: hasPlacement },
		{ key: 'over_under', label: 'O/U', enabled: hasOverUnder }
	]);

	const placementSubs: { key: PlacementSub; label: string }[] = [
		{ key: 'placement_2nd', label: '2nd' },
		{ key: 'placement_3rd', label: '3rd' },
		{ key: 'placement_last', label: 'Last' }
	];
</script>

<div class="flex flex-col border-b border-[--guild-border]">
	<div class="flex">
		{#each tabs as tab (tab.key)}
			<button
				onclick={() => {
					if (tab.enabled) selectedTab = tab.key;
				}}
				disabled={!tab.enabled}
				class="flex-1 py-2 text-xs font-semibold transition-colors
          {selectedTab === tab.key
					? 'border-b-2 border-[--guild-primary] text-[--guild-primary]'
					: tab.enabled
						? 'text-[--guild-text-secondary] hover:text-[--guild-text]'
						: 'cursor-not-allowed text-[--guild-border]'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if selectedTab === 'placement'}
		<div class="flex border-t border-[--guild-border] bg-slate-50">
			{#each placementSubs as sub (sub.key)}
				<button
					onclick={() => (selectedPlacementSub = sub.key)}
					class="flex-1 py-1.5 text-xs transition-colors
            {selectedPlacementSub === sub.key
						? 'font-semibold text-[--guild-primary]'
						: 'text-[--guild-text-secondary] hover:text-[--guild-text]'}"
				>
					{sub.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
