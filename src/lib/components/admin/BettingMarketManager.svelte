<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { adminStore } from '$lib/stores/admin.svelte';

	type MarketAction = 'void' | 'resettle';

	const clubUuid = $derived(auth.user?.activeClubUuid ?? null);
	const bettingAccess = $derived(auth.bettingAccess);
	const markets = $derived(adminStore.bettingMarkets);
	let reasonByMarketId = $state<Record<number, string>>({});
	let validationError = $state<string | null>(null);

	$effect(() => {
		if (!clubUuid || bettingAccess.state === 'disabled') {
			adminStore.bettingMarkets = [];
			return;
		}

		void adminStore.loadBettingMarkets(clubUuid);
	});

	function formatDate(value: string | null): string {
		if (!value) return 'Not settled';
		return new Date(value).toLocaleString();
	}

	function setReason(marketId: number, value: string): void {
		reasonByMarketId = {
			...reasonByMarketId,
			[marketId]: value
		};
	}

	async function handleAction(marketId: number, action: MarketAction): Promise<void> {
		validationError = null;
		if (!clubUuid) {
			validationError = 'Active club UUID is missing.';
			return;
		}

		const reason = reasonByMarketId[marketId]?.trim() ?? '';
		if (!reason) {
			validationError = 'A reason is required for betting market actions.';
			return;
		}

		const ok = await adminStore.applyBettingMarketAction(clubUuid, marketId, action, reason);
		if (ok) {
			setReason(marketId, '');
		}
	}
</script>

<div class="space-y-4 rounded-xl border border-[#B89B5E]/20 bg-[var(--guild-surface)] px-5 py-4">
	{#if adminStore.successMessage}
		<div
			class="rounded-lg border border-[#007474]/40 bg-[#007474]/10 px-4 py-3 text-sm text-[#007474]"
		>
			{adminStore.successMessage}
		</div>
	{/if}
	{#if adminStore.errorMessage}
		<div class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{adminStore.errorMessage}
		</div>
	{/if}
	{#if validationError}
		<div class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{validationError}
		</div>
	{/if}

	<div
		class="rounded-lg border border-[#B89B5E]/20 bg-[#B89B5E]/5 px-3 py-2 text-xs text-[var(--guild-text-secondary)]"
	>
		Void refunds every ticket on the market. Resettle regrades the market against the finalized
		round result and posts wallet corrections if the outcome changed.
	</div>

	{#if adminStore.bettingMarketsLoading}
		<p class="text-sm text-[var(--guild-text-secondary)]">Loading betting markets…</p>
	{:else if markets.length === 0}
		<div
			class="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-[var(--guild-text-secondary)]"
		>
			No persisted betting markets yet.
		</div>
	{:else}
		<div class="space-y-4">
			{#each markets as market (market.id)}
				<div class="rounded-xl border border-[#B89B5E]/15 bg-[var(--guild-surface-elevated)] p-4">
					<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div class="space-y-2">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="font-['Fraunces'] text-lg text-[var(--guild-text)]">{market.title}</h3>
								<span
									class="rounded-full border border-[#B89B5E]/30 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#B89B5E] uppercase"
								>
									{market.status}
								</span>
							</div>
							<p class="text-sm text-[var(--guild-text-secondary)]">
								{market.round_title} • {market.market_type.replaceAll('_', ' ')}
							</p>
							<p class="text-sm text-[var(--guild-text-secondary)]">
								{market.result_summary || 'No settlement summary yet.'}
							</p>
						</div>

						<div
							class="grid grid-cols-2 gap-3 text-xs text-[var(--guild-text-secondary)] sm:grid-cols-4"
						>
							<div>
								<p class="uppercase">Tickets</p>
								<p class="mt-1 text-sm text-[var(--guild-text)]">{market.ticket_count}</p>
							</div>
							<div>
								<p class="uppercase">Exposure</p>
								<p class="mt-1 text-sm text-[var(--guild-text)]">{market.exposure}</p>
							</div>
							<div>
								<p class="uppercase">Locked</p>
								<p class="mt-1 text-sm text-[var(--guild-text)]">
									{new Date(market.locks_at).toLocaleString()}
								</p>
							</div>
							<div>
								<p class="uppercase">Settled</p>
								<p class="mt-1 text-sm text-[var(--guild-text)]">{formatDate(market.settled_at)}</p>
							</div>
						</div>
					</div>

					<div class="mt-4 grid gap-3 text-xs text-[var(--guild-text-secondary)] sm:grid-cols-4">
						<div>
							Accepted: <span class="text-[var(--guild-text)]">{market.accepted_tickets}</span>
						</div>
						<div>Won: <span class="text-[var(--guild-text)]">{market.won_tickets}</span></div>
						<div>Lost: <span class="text-[var(--guild-text)]">{market.lost_tickets}</span></div>
						<div>Voided: <span class="text-[var(--guild-text)]">{market.voided_tickets}</span></div>
					</div>

					<div class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
						<input
							type="text"
							value={reasonByMarketId[market.id] ?? ''}
							oninput={(event) =>
								setReason(market.id, (event.currentTarget as HTMLInputElement).value)}
							placeholder="Required reason for void/resettle…"
							disabled={adminStore.loading}
							class="w-full rounded-lg border border-[#B89B5E]/30 bg-[var(--guild-surface)] px-3 py-2 font-['Space_Grotesk'] text-sm text-[var(--guild-text)] focus:ring-1 focus:ring-[#B89B5E] focus:outline-none disabled:opacity-60"
						/>
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								class="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
								disabled={adminStore.loading || market.status === 'voided'}
								onclick={() => handleAction(market.id, 'void')}
							>
								Void Market
							</button>
							<button
								type="button"
								class="rounded-lg bg-[#B89B5E] px-3 py-2 text-sm font-medium text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
								disabled={adminStore.loading ||
									(market.status !== 'settled' && market.status !== 'voided')}
								onclick={() => handleAction(market.id, 'resettle')}
							>
								Resettle
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
