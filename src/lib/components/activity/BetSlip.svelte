<script lang="ts">
	let {
		selectedOption,
		availableBalance,
		onPlaceBet,
		placing = false,
		error = null
	}: {
		selectedOption: { label: string; decimal_odds: number } | null;
		availableBalance: number;
		onPlaceBet: (stake: number) => Promise<void>;
		placing?: boolean;
		error?: string | null;
	} = $props();

	let stake = $state('25');
	let confirmPending = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | null = null;

	const stakeNum = $derived(parseInt(stake, 10) || 0);
	const payout = $derived(selectedOption ? Math.round(stakeNum * selectedOption.decimal_odds) : 0);
	const isValid = $derived(
		!!selectedOption && stakeNum > 0 && stakeNum <= availableBalance && !placing
	);

	function handleClick() {
		if (!isValid) return;
		if (!confirmPending) {
			confirmPending = true;
			confirmTimer = setTimeout(() => {
				confirmPending = false;
			}, 5000);
			return;
		}
		clearTimeout(confirmTimer!);
		confirmPending = false;
		onPlaceBet(stakeNum);
	}

	$effect(() => {
		if (!selectedOption) {
			confirmPending = false;
			clearTimeout(confirmTimer!);
		}
	});
</script>

{#if selectedOption}
	<div class="flex flex-col gap-2 border-t border-[--guild-border] bg-white p-3">
		<div class="flex items-center gap-2">
			<label class="text-xs text-[--guild-text-secondary]" for="stake-input">Stake</label>
			<input
				id="stake-input"
				type="number"
				min="1"
				max={availableBalance}
				bind:value={stake}
				class="w-20 rounded border border-[--guild-border] px-2 py-1 text-sm focus:ring-1 focus:ring-[--guild-primary] focus:outline-none"
			/>
			{#if payout > 0}
				<span class="ml-auto text-xs text-[--guild-text-secondary]">
					Return: <span class="font-semibold text-[--guild-text]">{payout} pts</span>
				</span>
			{/if}
		</div>

		{#if stakeNum > availableBalance}
			<p class="text-xs text-[--guild-error-text]">
				Not enough points. Available: {availableBalance} pts.
			</p>
		{/if}

		{#if error}
			<p class="text-xs text-[--guild-error-text]">{error}</p>
		{/if}

		<button
			onclick={handleClick}
			disabled={!isValid}
			class="rounded-lg py-2 text-sm font-semibold text-white transition-all
        {placing
				? 'cursor-wait bg-[--guild-primary] opacity-70'
				: confirmPending
					? 'animate-pulse bg-amber-500'
					: isValid
						? 'bg-[--guild-primary] hover:opacity-90'
						: 'cursor-not-allowed bg-[--guild-border]'}"
		>
			{#if placing}
				Placing…
			{:else if confirmPending}
				Confirm: {stakeNum} on {selectedOption.label} @ {selectedOption.decimal_odds.toFixed(2)}?
			{:else}
				Place Bet
			{/if}
		</button>
	</div>
{/if}
