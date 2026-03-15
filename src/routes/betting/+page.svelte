<script lang="ts">
	import { untrack } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { betting } from '$lib/stores/betting.svelte';
	import { clubService } from '$lib/stores/club.svelte';

	const access = $derived(auth.bettingAccess);
	const overview = $derived(betting.overview);
	const nextMarket = $derived(betting.nextMarket);
	const journalEntries = $derived(overview?.journal ?? []);
	const numberFormat = new Intl.NumberFormat();
	let selectedOptionKey = $state('');
	let stake = $state('25');

	// ---------------------------------------------------------------------------
	// Market tab state
	// ---------------------------------------------------------------------------
	type TopTab = 'round_winner' | 'placement' | 'over_under';
	type PlacementSub = 'placement_2nd' | 'placement_3rd' | 'placement_last';

	let selectedTab = $state<TopTab>('round_winner');
	let selectedPlacementSub = $state<PlacementSub>('placement_2nd');

	// Prefer the plural markets array; fall back to singular for older snapshots.
	const allMarkets = $derived(
		nextMarket?.markets && nextMarket.markets.length > 0
			? nextMarket.markets
			: nextMarket?.market
				? [nextMarket.market]
				: []
	);

	const effectiveMarketType = $derived(
		selectedTab === 'placement' ? selectedPlacementSub : selectedTab
	);

	const activeMarket = $derived(allMarkets.find((m) => m.type === effectiveMarketType) ?? null);

	const has2nd = $derived(allMarkets.some((m) => m.type === 'placement_2nd'));
	const has3rd = $derived(allMarkets.some((m) => m.type === 'placement_3rd'));
	const hasLast = $derived(allMarkets.some((m) => m.type === 'placement_last'));
	const hasOverUnder = $derived(allMarkets.some((m) => m.type === 'over_under'));

	const isOverUnder = $derived(effectiveMarketType === 'over_under');
	const col1Header = $derived(isOverUnder ? 'Selection' : 'Player');
	const emptyStateText = $derived(isOverUnder ? 'Choose a selection' : 'Choose a player');

	// ---------------------------------------------------------------------------
	// Bet form state
	// ---------------------------------------------------------------------------
	const selectedOption = $derived(
		activeMarket?.options.find((o) => o.option_key === selectedOptionKey) ?? null
	);

	const canPlaceBet = $derived(
		access.state === 'enabled' &&
			activeMarket?.status === 'open' &&
			Boolean(selectedOptionKey) &&
			!betting.placingBet
	);

	const stakeExceedsBalance = $derived(
		!!stake &&
			!!betting.overview?.wallet.available &&
			Number.parseInt(stake || '0', 10) > betting.overview.wallet.available
	);

	// ---------------------------------------------------------------------------
	// Access copy
	// ---------------------------------------------------------------------------
	const accessCopy = $derived.by(() => {
		switch (access.state) {
			case 'enabled':
				return {
					title: 'Betting Enabled',
					body: 'Seasonal betting is live for this club. The wallet below mirrors season points, records betting-only ledger movement, and now exposes the next round winner market.'
				};
			case 'frozen':
				return {
					title: 'Betting Frozen',
					body: 'This club is in read-only freeze. Wallet history and market snapshots stay visible, but settings, new bets, and future market creation remain locked until access is restored.'
				};
			default:
				return {
					title: 'Betting Locked',
					body: 'Betting is not enabled for this club. Access is controlled at the club level and follows the current premium entitlement state.'
				};
		}
	});

	const stateClass = $derived.by(() => {
		switch (access.state) {
			case 'enabled':
				return 'border-[#007474]/30 bg-[#007474]/10 text-[#6ee7d8]';
			case 'frozen':
				return 'border-[#B89B5E]/30 bg-[#B89B5E]/10 text-[#e4c98e]';
			default:
				return 'border-white/10 bg-white/5 text-white/70';
		}
	});

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------
	function formatPoints(value: number): string {
		return `${numberFormat.format(value)} pts`;
	}

	function formatSignedPoints(value: number): string {
		if (value === 0) return formatPoints(value);
		return `${value > 0 ? '+' : ''}${numberFormat.format(value)} pts`;
	}

	function formatOdds(value: number): string {
		return value.toFixed(2);
	}

	// ---------------------------------------------------------------------------
	// Handlers
	// ---------------------------------------------------------------------------
	async function handleTargetingToggle(event: Event): Promise<void> {
		const checked = (event.currentTarget as HTMLInputElement).checked;
		const ok = await betting.updateSettings({ optOutTargeting: checked });
		if (!ok && overview) {
			betting.overview = {
				...overview,
				settings: { ...overview.settings }
			};
		}
	}

	async function handlePlaceBet(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!nextMarket?.round || !activeMarket || !selectedOptionKey) return;

		const parsedStake = Number.parseInt(stake, 10);
		if (!Number.isFinite(parsedStake) || parsedStake <= 0) {
			betting.error = 'Stake must be greater than zero.';
			betting.errorCode = 'invalid_stake';
			return;
		}

		await betting.placeBet({
			roundId: nextMarket.round.id,
			selectionKey: selectedOptionKey,
			stake: parsedStake,
			marketType: effectiveMarketType
		});
	}

	// Reset selection when active market changes.
	$effect(() => {
		const options = activeMarket?.options ?? [];
		if (options.length === 0) {
			selectedOptionKey = '';
			return;
		}
		if (!options.some((o) => o.option_key === selectedOptionKey)) {
			selectedOptionKey = options[0].option_key;
		}
	});

	// Auto-select a valid placement sub when switching to the Placement tab.
	$effect(() => {
		if (selectedTab !== 'placement') return;
		if (selectedPlacementSub === 'placement_2nd' && !has2nd) {
			if (hasLast) selectedPlacementSub = 'placement_last';
			else if (has3rd) selectedPlacementSub = 'placement_3rd';
		}
	});

	$effect(() => {
		const clubUuid = auth.user?.activeClubUuid ?? null;
		if (!clubUuid || (access.state !== 'enabled' && access.state !== 'frozen')) {
			untrack(() => betting.clear());
			return;
		}
		untrack(() => {
			void betting.loadOverview(clubUuid);
		});
	});
</script>

<svelte:head>
	<title>Betting</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
	<div class="space-y-3">
		<p class="text-xs font-semibold tracking-[0.28em] text-[#6ee7d8]/70 uppercase">Betting</p>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 class="text-3xl font-semibold text-white">
					{clubService.info?.name ?? 'Club'} betting access
				</h1>
				<p class="mt-2 max-w-2xl text-sm text-white/65">
					Feature access is resolved per club and carried through auth, club info, Discord guild
					config, and the PWA.
				</p>
			</div>
			<div class={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${stateClass}`}>
				{access.state}
			</div>
		</div>
	</div>

	<section
		class="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
	>
		<h2 class="text-xl font-semibold text-white">{accessCopy.title}</h2>
		<p class="mt-3 max-w-2xl text-sm leading-6 text-white/70">{accessCopy.body}</p>

		<div class="mt-6 grid gap-4 sm:grid-cols-2">
			<div class="rounded-2xl border border-white/10 bg-black/10 p-4">
				<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">Source</p>
				<p class="mt-2 text-sm text-white/80">{access.source}</p>
			</div>
			<div class="rounded-2xl border border-white/10 bg-black/10 p-4">
				<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">Reason</p>
				<p class="mt-2 text-sm text-white/80">
					{access.reason || 'No additional reason provided.'}
				</p>
			</div>
		</div>
	</section>

	{#if access.state === 'enabled' || access.state === 'frozen'}
		<section class="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
			<div class="space-y-4">
				<!-- Wallet stats -->
				<div class="grid gap-4 sm:grid-cols-3">
					<div class="rounded-2xl border border-white/10 bg-black/15 p-4">
						<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">
							Available Wallet
						</p>
						<p class="mt-3 text-2xl font-semibold text-white">
							{formatPoints(overview?.wallet.available ?? 0)}
						</p>
						<p class="mt-2 text-sm text-white/60">Season mirror minus open stake reservations.</p>
					</div>
					<div class="rounded-2xl border border-white/10 bg-black/15 p-4">
						<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">
							Season Mirror
						</p>
						<p class="mt-3 text-2xl font-semibold text-white">
							{formatPoints(overview?.wallet.season_points ?? 0)}
						</p>
						<p class="mt-2 text-sm text-white/60">
							Current season standing points mirrored into betting.
						</p>
					</div>
					<div class="rounded-2xl border border-white/10 bg-black/15 p-4">
						<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">
							Ledger Delta
						</p>
						<p
							class={`mt-3 text-2xl font-semibold ${overview && overview.wallet.adjustment_balance < 0 ? 'text-[#ff9f7f]' : 'text-[#6ee7d8]'}`}
						>
							{formatSignedPoints(overview?.wallet.adjustment_balance ?? 0)}
						</p>
						<p class="mt-2 text-sm text-white/60">
							Admin corrections, stake reservations, and future settlements.
						</p>
					</div>
				</div>

				<!-- Season / settings -->
				<div class="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">Season</p>
							<h2 class="mt-2 text-xl font-semibold text-white">
								{overview?.season_name ?? 'Season Wallet'}
							</h2>
						</div>
						<p class="text-sm text-white/60">
							{overview?.season_id ?? 'default'} • access via {overview?.access_source ??
								access.source}
						</p>
					</div>

					{#if betting.loading && !overview}
						<p class="mt-6 text-sm text-white/60">Loading betting overview...</p>
					{:else if betting.error && !overview}
						<div class="mt-6 rounded-2xl border border-[#ff9f7f]/25 bg-[#ff9f7f]/10 p-4">
							<p class="text-sm font-medium text-[#ffd4c7]">{betting.error}</p>
						</div>
					{:else if overview}
						<div class="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
							<div class="rounded-2xl border border-white/10 bg-black/10 p-4">
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-sm font-medium text-white">Targeting Preference</p>
										<p class="mt-2 max-w-xl text-sm leading-6 text-white/60">
											Opt out if you do not want other players betting on your placement markets.
											You can still use betting yourself either way.
										</p>
									</div>
									<label class="inline-flex cursor-pointer items-center gap-3">
										<input
											type="checkbox"
											class="h-5 w-5 rounded border-white/20 bg-black/20 text-[#6ee7d8] focus:ring-[#6ee7d8]"
											checked={overview.settings.opt_out_targeting}
											disabled={overview.read_only || betting.savingSettings}
											onchange={handleTargetingToggle}
										/>
										<span class="text-sm text-white/80">Opt out</span>
									</label>
								</div>
								<p class="mt-4 text-xs text-white/45">
									{#if overview.read_only}
										Settings are locked while betting access is frozen.
									{:else if overview.settings.updated_at}
										Last updated {new Date(overview.settings.updated_at).toLocaleString()}.
									{:else}
										No explicit targeting preference saved yet.
									{/if}
								</p>
							</div>

							<div class="rounded-2xl border border-white/10 bg-black/10 p-4">
								<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">
									Reserved
								</p>
								<p class="mt-3 text-2xl font-semibold text-white">
									{formatPoints(overview.wallet.reserved)}
								</p>
								<p class="mt-2 text-sm text-white/60">
									Open stakes currently held out of the available wallet.
								</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Market panel -->
				<div class="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">
								Next Market
							</p>
							<h2 class="mt-2 text-xl font-semibold text-white">
								{activeMarket?.title ?? 'Markets'}
							</h2>
						</div>
						{#if nextMarket && allMarkets.length > 0}
							<p class="text-sm text-white/60">
								Locks {new Date(allMarkets[0]?.locks_at ?? '').toLocaleString()}
							</p>
						{/if}
					</div>

					{#if !nextMarket}
						<p class="mt-6 text-sm text-white/60">Waiting for market data…</p>
					{:else if allMarkets.length === 0}
						<div
							class="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/60"
						>
							No upcoming round currently has enough accepted, opted-in players to open a market.
						</div>
					{:else}
						<!-- Tab bar -->
						<div class="mt-6 flex flex-wrap gap-2">
							<button
								type="button"
								class={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${selectedTab === 'round_winner' ? 'bg-[#007474]/30 text-[#6ee7d8] ring-1 ring-[#6ee7d8]/40' : 'text-white/55 hover:text-white/80'}`}
								onclick={() => (selectedTab = 'round_winner')}
							>
								Winner
							</button>
							<button
								type="button"
								class={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${selectedTab === 'placement' ? 'bg-[#007474]/30 text-[#6ee7d8] ring-1 ring-[#6ee7d8]/40' : 'text-white/55 hover:text-white/80'} ${!has2nd && !has3rd && !hasLast ? 'cursor-not-allowed opacity-40' : ''}`}
								disabled={!has2nd && !has3rd && !hasLast}
								onclick={() => (selectedTab = 'placement')}
							>
								Placement
							</button>
							<button
								type="button"
								class={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${selectedTab === 'over_under' ? 'bg-[#007474]/30 text-[#6ee7d8] ring-1 ring-[#6ee7d8]/40' : 'text-white/55 hover:text-white/80'} ${!hasOverUnder ? 'cursor-not-allowed opacity-40' : ''}`}
								disabled={!hasOverUnder}
								onclick={() => (selectedTab = 'over_under')}
							>
								Score O/U
							</button>
						</div>

						<!-- Placement sub-tabs -->
						{#if selectedTab === 'placement'}
							<div class="mt-3 flex gap-1.5">
								<button
									type="button"
									class={`rounded-lg px-3 py-1 text-xs transition ${selectedPlacementSub === 'placement_2nd' && has2nd ? 'bg-white/10 text-white' : 'text-white/45'} ${!has2nd ? 'cursor-not-allowed line-through opacity-40' : 'hover:text-white/80'}`}
									disabled={!has2nd}
									onclick={() => has2nd && (selectedPlacementSub = 'placement_2nd')}
								>
									2nd Place
								</button>
								<button
									type="button"
									class={`rounded-lg px-3 py-1 text-xs transition ${selectedPlacementSub === 'placement_3rd' && has3rd ? 'bg-white/10 text-white' : 'text-white/45'} ${!has3rd ? 'cursor-not-allowed line-through opacity-40' : 'hover:text-white/80'}`}
									disabled={!has3rd}
									onclick={() => has3rd && (selectedPlacementSub = 'placement_3rd')}
								>
									3rd Place
								</button>
								<button
									type="button"
									class={`rounded-lg px-3 py-1 text-xs transition ${selectedPlacementSub === 'placement_last' && hasLast ? 'bg-white/10 text-white' : 'text-white/45'} ${!hasLast ? 'cursor-not-allowed line-through opacity-40' : 'hover:text-white/80'}`}
									disabled={!hasLast}
									onclick={() => hasLast && (selectedPlacementSub = 'placement_last')}
								>
									Last Place
								</button>
							</div>
						{/if}

						<div class="mt-4 space-y-4">
							<!-- Round info -->
							<div class="rounded-2xl border border-white/10 bg-black/10 p-4">
								<p class="text-sm font-medium text-white">{nextMarket.round?.title}</p>
								<p class="mt-2 text-sm text-white/60">
									Starts {new Date(nextMarket.round?.start_time ?? '').toLocaleString()}
								</p>
								<p class="mt-3 text-xs tracking-[0.18em] text-white/40 uppercase">
									{activeMarket?.title ?? effectiveMarketType.replaceAll('_', ' ')}
									{#if activeMarket?.ephemeral}
										• priced live until the first accepted ticket
									{/if}
								</p>
							</div>

							{#if !activeMarket}
								<div
									class="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/60"
								>
									This market isn't available for the current round size.
								</div>
							{:else}
								<!-- Options table -->
								<div class="overflow-hidden rounded-2xl border border-white/10">
									<div
										class="grid grid-cols-[minmax(0,1.3fr)_100px_100px_72px] gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold tracking-[0.18em] text-white/45 uppercase"
									>
										<span>{col1Header}</span>
										<span>Chance</span>
										<span>Odds</span>
										<span>Pick</span>
									</div>
									{#each activeMarket.options as option (option.option_key)}
										{@const isRestricted = option.self_bet_restricted === true}
										<label
											class={`grid grid-cols-[minmax(0,1.3fr)_100px_100px_72px] gap-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0 ${isRestricted ? 'cursor-not-allowed bg-black/5 opacity-60' : 'cursor-pointer bg-black/10'}`}
										>
											<span class={`font-medium ${isRestricted ? 'text-white/50' : 'text-white'}`}>
												{option.label}
												{#if isRestricted}
													<span class="ml-2 text-xs text-white/35">Can't bet on yourself</span>
												{/if}
											</span>
											<span class="text-white/70">{option.probability_percent}%</span>
											<span class={isRestricted ? 'text-white/40' : 'text-[#6ee7d8]'}>
												{formatOdds(option.decimal_odds)}
											</span>
											<span class="flex justify-end">
												<input
													type="radio"
													class="h-4 w-4 border-white/20 bg-black/20 text-[#6ee7d8] focus:ring-[#6ee7d8] disabled:cursor-not-allowed disabled:opacity-40"
													name="market-selection"
													value={option.option_key}
													bind:group={selectedOptionKey}
													disabled={access.state !== 'enabled' ||
														activeMarket.status !== 'open' ||
														isRestricted}
												/>
											</span>
										</label>
									{/each}
								</div>

								<!-- Bet form -->
								<form
									class="rounded-2xl border border-white/10 bg-black/10 p-4"
									onsubmit={handlePlaceBet}
								>
									<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
										<div>
											<p class="text-sm font-medium text-white">Stake</p>
											<p class="mt-2 text-sm text-white/60">
												Selected:
												<span class="text-white">{selectedOption?.label ?? emptyStateText}</span>
												{#if selectedOption}
													• {formatOdds(selectedOption.decimal_odds)} odds
												{/if}
											</p>
										</div>
										<div>
											<input
												type="number"
												min="1"
												max={betting.overview?.wallet.available ?? undefined}
												step="1"
												inputmode="numeric"
												class="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white transition outline-none focus:border-[#6ee7d8]/50"
												bind:value={stake}
												disabled={access.state !== 'enabled' || betting.placingBet}
											/>
											{#if stakeExceedsBalance}
												<p class="mt-1 text-sm text-red-400">
													Stake exceeds your available balance of {formatPoints(
														betting.overview?.wallet.available ?? 0
													)}.
												</p>
											{/if}
										</div>
									</div>

									<div
										class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<p class="text-sm text-white/60">
											{#if selectedOption}
												Potential return:
												<span class="text-white">
													{formatPoints(
														Math.round(
															Number.parseInt(stake || '0', 10) * selectedOption.decimal_odds
														)
													)}
												</span>
											{:else}
												{emptyStateText} to place a bet.
											{/if}
										</p>
										<button
											type="submit"
											class="rounded-full border border-[#6ee7d8]/30 bg-[#007474]/20 px-5 py-2 text-sm font-semibold text-[#6ee7d8] transition hover:bg-[#007474]/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
											disabled={!canPlaceBet || stakeExceedsBalance}
										>
											{betting.placingBet ? 'Placing...' : 'Place Bet'}
										</button>
									</div>

									{#if access.state === 'frozen'}
										<p class="mt-4 text-xs text-white/45">
											Bet placement is locked while betting access is frozen.
										</p>
									{:else if activeMarket.status !== 'open'}
										<p class="mt-4 text-xs text-white/45">
											This market is locked because the round start time has passed.
										</p>
									{:else if betting.actionMessage}
										<p class="mt-4 text-xs text-[#6ee7d8]">{betting.actionMessage}</p>
									{/if}
								</form>

								{#if betting.error && betting.errorCode === 'invalid_stake'}
									<div class="mt-4 rounded-2xl border border-[#ff9f7f]/25 bg-[#ff9f7f]/10 p-4">
										<p class="text-sm font-medium text-[#ffd4c7]">{betting.error}</p>
									</div>
								{/if}

								{#if betting.error && betting.errorCode === 'self_bet_prohibited'}
									<div class="mt-4 rounded-2xl border border-[#ff9f7f]/25 bg-[#ff9f7f]/10 p-4">
										<p class="text-sm font-medium text-[#ffd4c7]">
											You can't bet on yourself in this market.
										</p>
									</div>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Wallet journal -->
			<div class="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-xs font-semibold tracking-[0.22em] text-white/45 uppercase">
							Wallet Journal
						</p>
						<h2 class="mt-2 text-xl font-semibold text-white">Recent Entries</h2>
					</div>
					{#if betting.loading}
						<p class="text-xs font-semibold text-white/45 uppercase">Refreshing</p>
					{/if}
				</div>

				{#if journalEntries.length === 0}
					<div
						class="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/60"
					>
						No betting-only wallet entries yet. This view shows corrections first, then stake
						reservations and future settlement movements.
					</div>
				{:else}
					<div class="mt-6 space-y-3">
						{#each journalEntries as entry (entry.id)}
							<div class="rounded-2xl border border-white/10 bg-black/10 p-4">
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-sm font-medium text-white">{entry.reason || entry.entry_type}</p>
										<p class="mt-1 text-xs tracking-[0.18em] text-white/40 uppercase">
											{entry.entry_type.replaceAll('_', ' ')}
										</p>
									</div>
									<p
										class={`text-sm font-semibold ${entry.amount < 0 ? 'text-[#ff9f7f]' : 'text-[#6ee7d8]'}`}
									>
										{formatSignedPoints(entry.amount)}
									</p>
								</div>
								<p class="mt-3 text-xs text-white/45">
									{new Date(entry.created_at).toLocaleString()}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	{/if}
</div>
