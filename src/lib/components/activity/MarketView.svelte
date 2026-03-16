<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { BettingMarketSnapshot, BettingOverview } from '$lib/stores/activity-betting.svelte';
	import MarketTabs from './MarketTabs.svelte';
	import MarketTable from './MarketTable.svelte';
	import BetSlip from './BetSlip.svelte';
	import WalletBar from './WalletBar.svelte';
	import NoMarket from './NoMarket.svelte';

	let {
		market,
		overview,
		onPlaceBet,
		placing = false,
		betError = null,
		readonly = false
	}: {
		market: BettingMarketSnapshot | null;
		overview: BettingOverview | null;
		onPlaceBet: (params: {
			selectionKey: string;
			stake: number;
			marketType: string;
		}) => Promise<void>;
		placing?: boolean;
		betError?: string | null;
		readonly?: boolean;
	} = $props();

	type TopTab = 'round_winner' | 'placement' | 'over_under';
	type PlacementSub = 'placement_2nd' | 'placement_3rd' | 'placement_last';

	let selectedTab = $state<TopTab>('round_winner');
	let selectedPlacementSub = $state<PlacementSub>('placement_2nd');
	let selectedKey = $state('');

	const allMarkets = $derived(
		market?.markets && market.markets.length > 0
			? market.markets
			: market?.market
				? [market.market]
				: []
	);

	const hasWinner = $derived(allMarkets.some((m) => m.type === 'round_winner'));
	const hasPlacement = $derived(
		allMarkets.some((m) => ['placement_2nd', 'placement_3rd', 'placement_last'].includes(m.type))
	);
	const hasOverUnder = $derived(allMarkets.some((m) => m.type === 'over_under'));

	const effectiveType = $derived(selectedTab === 'placement' ? selectedPlacementSub : selectedTab);

	const activeMarket = $derived(allMarkets.find((m) => m.type === effectiveType) ?? null);
	const isOpen = $derived(activeMarket?.status === 'open');

	const selectedOption = $derived(
		activeMarket?.options.find((o) => o.option_key === selectedKey) ?? null
	);

	const available = $derived(overview?.wallet?.available ?? 0);

	// Reset selection when market type changes
	$effect(() => {
		void effectiveType;
		selectedKey = '';
	});

	function formatLockTime(locksAt: string): string {
		try {
			return new Date(locksAt).toLocaleString(undefined, {
				weekday: 'short',
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return locksAt;
		}
	}
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<WalletBar {overview} />

	{#if !activeMarket && allMarkets.length === 0}
		<div transition:fade={{ duration: 200 }}>
			<NoMarket />
		</div>
	{:else}
		{#if allMarkets.length > 1 || hasPlacement}
			<MarketTabs
				bind:selectedTab
				bind:selectedPlacementSub
				{hasWinner}
				{hasPlacement}
				{hasOverUnder}
			/>
		{/if}

		{#if activeMarket}
			<div transition:fade={{ duration: 150 }}>
				<div class="flex items-center justify-between px-3 py-2">
					<span class="text-xs font-semibold tracking-wide text-[--guild-text-secondary] uppercase">
						{activeMarket.title}
					</span>
					{#if activeMarket.locks_at}
						<span class="text-xs text-[--guild-text-secondary]">
							Locks {formatLockTime(activeMarket.locks_at)}
						</span>
					{/if}
				</div>

				{#if activeMarket.status === 'locked'}
					<p class="px-3 py-1 text-xs text-amber-700">Market locked — betting is closed.</p>
				{:else if activeMarket.status === 'suspended'}
					<p class="px-3 py-1 text-xs text-amber-700">Betting is frozen.</p>
				{/if}

				<div class="min-h-0 flex-1 overflow-y-auto">
					<MarketTable
						options={activeMarket.options}
						bind:selectedKey
						readonly={readonly || !isOpen}
					/>
				</div>

				{#if !readonly && overview?.access_state === 'enabled'}
					<BetSlip
						{selectedOption}
						availableBalance={available}
						onPlaceBet={async (stake) => {
							if (!selectedOption) return;
							await onPlaceBet({
								selectionKey: selectedKey,
								stake,
								marketType: effectiveType
							});
							selectedKey = '';
						}}
						{placing}
						error={betError}
					/>
				{/if}
			</div>
		{:else}
			<NoMarket />
		{/if}
	{/if}
</div>
