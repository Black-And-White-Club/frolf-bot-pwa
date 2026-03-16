<script lang="ts">
	import type { BettingMarketOption } from '$lib/stores/activity-betting.svelte';

	let {
		options,
		selectedKey = $bindable(''),
		readonly = false
	}: {
		options: BettingMarketOption[];
		selectedKey: string;
		readonly?: boolean;
	} = $props();

	function formatOdds(decimal: number): string {
		return decimal.toFixed(2);
	}
</script>

<div class="flex flex-col divide-y divide-[--guild-border]">
	{#each options as opt (opt.option_key)}
		{@const prob = opt.probability_percent}
		{@const isSelected = selectedKey === opt.option_key}
		{@const isSelfBet = opt.self_bet_restricted}

		<button
			onclick={() => {
				if (!isSelfBet && !readonly) selectedKey = isSelected ? '' : opt.option_key;
			}}
			disabled={isSelfBet || readonly}
			class="relative flex items-center gap-2 overflow-hidden px-3 py-2.5 text-left transition-colors
        {isSelected ? 'bg-teal-50' : 'bg-white hover:bg-slate-50'}
        {isSelfBet ? 'cursor-not-allowed opacity-50' : ''}"
		>
			<!-- Probability bar background -->
			<span
				class="pointer-events-none absolute inset-y-0 left-0 bg-[--guild-primary] opacity-10 transition-[width] duration-500"
				style="width:{prob}%"
			></span>

			<!-- Radio indicator -->
			<span
				class="relative z-10 h-4 w-4 shrink-0 rounded-full border-2 transition-colors
          {isSelected
					? 'border-[--guild-primary] bg-[--guild-primary]'
					: 'border-[--guild-border] bg-white'}"
			></span>

			<!-- Label -->
			<span class="relative z-10 flex-1 text-sm font-medium text-[--guild-text]">
				{opt.label}
				{#if isSelfBet}<span class="ml-1 text-xs">🔒</span>{/if}
			</span>

			<!-- Stats -->
			<span class="relative z-10 shrink-0 text-right text-xs text-[--guild-text-secondary]">
				<span class="block font-semibold text-[--guild-text]">{formatOdds(opt.decimal_odds)}x</span>
				<span>{prob}%</span>
			</span>
		</button>
	{/each}
</div>
