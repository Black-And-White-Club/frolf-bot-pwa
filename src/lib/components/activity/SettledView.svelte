<script lang="ts">
	import type {
		BettingMarketSettledPayload,
		BettingWalletJournalEntry
	} from '$lib/stores/activity-betting.svelte';
	import { onMount, onDestroy } from 'svelte';

	let {
		payload,
		journal = [],
		onDismiss
	}: {
		payload: BettingMarketSettledPayload;
		journal: BettingWalletJournalEntry[];
		onDismiss: () => void;
	} = $props();

	const DISMISS_SECS = 20;
	let countdown = $state(DISMISS_SECS);
	let timer: ReturnType<typeof setInterval>;

	// Find payout journal entries created near settlement time (last 5 entries of relevant types).
	const payoutEntries = $derived(
		journal
			.filter((e) =>
				['bet_payout', 'bet_void_refund', 'bet_void', 'bet_refund'].includes(e.entry_type)
			)
			.slice(0, 5)
	);

	const totalPayout = $derived(payoutEntries.reduce((s, e) => s + e.amount, 0));
	const isWin = $derived(totalPayout > 0);

	onMount(() => {
		timer = setInterval(() => {
			countdown -= 1;
			if (countdown <= 0) {
				clearInterval(timer);
				onDismiss();
			}
		}, 1000);
	});

	onDestroy(() => clearInterval(timer));
</script>

<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
	<!-- Icon -->
	<div class="text-5xl">{isWin ? '🏆' : '⛳'}</div>

	<!-- Headline -->
	<div>
		<p class="text-lg font-bold text-[--guild-text]">Market Settled!</p>
		{#if payload.result_summary}
			<p class="mt-1 text-sm text-[--guild-text-secondary]">{payload.result_summary}</p>
		{/if}
	</div>

	<!-- Payout summary -->
	{#if payoutEntries.length > 0}
		<div class="w-full max-w-xs rounded-xl border border-[--guild-border] bg-white p-4">
			<p class="mb-2 text-xs font-semibold tracking-wide text-[--guild-text-secondary] uppercase">
				Your Result
			</p>
			<div class="flex flex-col gap-1.5">
				{#each payoutEntries as entry (entry.id)}
					<div class="flex justify-between text-sm">
						<span class="text-[--guild-text-secondary]">{entry.reason}</span>
						<span
							class="font-semibold {entry.amount > 0
								? 'text-teal-600'
								: entry.amount < 0
									? 'text-red-600'
									: 'text-[--guild-text-secondary]'}"
						>
							{entry.amount > 0 ? '+' : ''}{entry.amount} pts
						</span>
					</div>
				{/each}
				{#if totalPayout !== 0}
					<div
						class="mt-1 flex justify-between border-t border-[--guild-border] pt-1 text-sm font-bold"
					>
						<span>Total</span>
						<span class={totalPayout > 0 ? 'text-teal-600' : 'text-red-600'}>
							{totalPayout > 0 ? '+' : ''}{totalPayout} pts
						</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Dismiss -->
	<button
		onclick={onDismiss}
		class="rounded-lg bg-[--guild-primary] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
	>
		Continue <span class="opacity-60">({countdown})</span>
	</button>
</div>
