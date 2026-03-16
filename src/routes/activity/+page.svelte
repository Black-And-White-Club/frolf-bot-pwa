<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { initDiscord, subscribeToParticipants } from '$lib/discord';
	import type { ActivityParticipant } from '$lib/discord';
	import { activityAuth } from '$lib/stores/activity-auth.svelte';
	import {
		ActivityBettingService,
		extractClubUuidFromTicket
	} from '$lib/stores/activity-betting.svelte';
	import type {
		BettingMarketOpenedPayload,
		BettingMarketLockedPayload,
		BettingMarketSettledPayload,
		BettingMarketVoidedPayload,
		BettingMarketSuspendedPayload
	} from '$lib/stores/activity-betting.svelte';
	import { nats } from '$lib/stores/nats.svelte';
	import Loading from '$lib/components/activity/Loading.svelte';
	import AuthError from '$lib/components/activity/AuthError.svelte';
	import MarketView from '$lib/components/activity/MarketView.svelte';
	import ConnectionBanner from '$lib/components/activity/ConnectionBanner.svelte';
	import ParticipantList from '$lib/components/activity/ParticipantList.svelte';
	import SettledView from '$lib/components/activity/SettledView.svelte';

	// ── State machine ─────────────────────────────────────────────────────────
	type Phase = 'sdk_init' | 'authenticating' | 'loading' | 'ready' | 'error';
	let phase = $state<Phase>('sdk_init');
	let phaseMessage = $state('Connecting to Discord…');

	// ── Social / Phase 3 state ────────────────────────────────────────────────
	let participants = $state<ActivityParticipant[]>([]);
	let showSettled = $state(false);

	// ── Auth / club ───────────────────────────────────────────────────────────
	const clubUuid = $derived(
		activityAuth.ticket ? extractClubUuidFromTicket(activityAuth.ticket) : null
	);

	const betting = new ActivityBettingService(() => activityAuth.authHeader);

	// ── Subscription cleanup ──────────────────────────────────────────────────
	// Keep NATS subs separate from the Discord participant sub so that
	// setupNatsSubscriptions() can tear down and re-register only NATS subs
	// on reconnect without killing the participant listener.
	let natsUnsubs: Array<() => void> = [];
	let participantUnsubs: Array<() => void> = [];

	// ── Settlement: auto-show SettledView when lastSettled changes ─────────────
	$effect(() => {
		if (betting.lastSettled && phase === 'ready') {
			showSettled = true;
		}
	});

	// ── Main initialisation ───────────────────────────────────────────────────
	onMount(async () => {
		try {
			// 1. SDK handshake + OAuth code
			const { code } = await initDiscord();

			// 2. Token exchange
			phase = 'authenticating';
			phaseMessage = 'Authenticating…';
			await activityAuth.authenticate(code);

			if (activityAuth.status === 'error') {
				phase = 'error';
				return;
			}

			// 3. Connect NATS with ticket
			phase = 'loading';
			phaseMessage = 'Loading markets…';

			if (activityAuth.ticket) {
				await nats.connect(activityAuth.ticket);
				setupNatsSubscriptions();

				// The NATS library auto-reconnects with the existing connection.
				// Refresh the in-memory ticket for future API calls, re-register
				// subscriptions (they survive reconnect but need re-setup after
				// any explicit disconnect), and reload stale data.
				nats.onReconnect(async () => {
					await activityAuth.refreshSession();
					setupNatsSubscriptions();
					if (clubUuid) await betting.loadOverview(clubUuid);
				});
			}

			// 4. Subscribe to Discord voice participants (Phase 3)
			participantUnsubs.push(
				subscribeToParticipants((updated) => {
					participants = updated;
				})
			);

			// 5. Load initial data
			if (clubUuid) await betting.loadOverview(clubUuid);

			phase = 'ready';
		} catch (e) {
			console.error('[activity] init failed', e);
			activityAuth.error = e instanceof Error ? e.message : 'Unexpected error';
			phase = 'error';
		}
	});

	onDestroy(() => {
		natsUnsubs.forEach((fn) => fn());
		participantUnsubs.forEach((fn) => fn());
		nats.disconnect();
	});

	// ── NATS subscriptions ────────────────────────────────────────────────────
	function setupNatsSubscriptions() {
		natsUnsubs.forEach((fn) => fn());
		natsUnsubs = [];

		if (!clubUuid) return;

		natsUnsubs.push(
			nats.subscribe<BettingMarketOpenedPayload>(`betting.market.generated.v1.${clubUuid}`, (msg) =>
				betting.handleMarketOpened(msg.data, clubUuid!)
			),
			nats.subscribe<BettingMarketLockedPayload>(`betting.market.locked.v1.${clubUuid}`, (msg) =>
				betting.handleMarketLocked(msg.data, clubUuid!)
			),
			nats.subscribe<BettingMarketSettledPayload>(`betting.market.settled.v1.${clubUuid}`, (msg) =>
				betting.handleMarketSettled(msg.data, clubUuid!)
			),
			nats.subscribe<BettingMarketVoidedPayload>(`betting.market.voided.v1.${clubUuid}`, (msg) =>
				betting.handleMarketVoided(msg.data, clubUuid!)
			),
			nats.subscribe<BettingMarketSuspendedPayload>(
				`betting.market.suspended.v1.${clubUuid}`,
				(msg) => betting.handleMarketSuspended(msg.data, clubUuid!)
			)
		);
	}

	// ── Bet handler ───────────────────────────────────────────────────────────
	async function handlePlaceBet(params: {
		selectionKey: string;
		stake: number;
		marketType: string;
	}) {
		if (!clubUuid || !betting.nextMarket?.round) return;
		await betting.placeBet(clubUuid, {
			roundId: betting.nextMarket.round.id,
			selectionKey: params.selectionKey,
			stake: params.stake,
			marketType: params.marketType
		});
	}

	// ── Retry ─────────────────────────────────────────────────────────────────
	function retry() {
		activityAuth.reset();
		betting.clear();
		phase = 'sdk_init';
		phaseMessage = 'Connecting to Discord…';
		window.location.reload();
	}

	// ── Settlement dismiss ────────────────────────────────────────────────────
	function dismissSettled() {
		showSettled = false;
		betting.lastSettled = null;
	}
</script>

{#if phase === 'sdk_init' || phase === 'authenticating' || phase === 'loading'}
	<div class="flex flex-1 flex-col" transition:fade={{ duration: 150 }}>
		<Loading message={phaseMessage} />
	</div>
{:else if phase === 'error'}
	<div class="flex flex-1 flex-col" transition:fade={{ duration: 150 }}>
		<AuthError message={activityAuth.error ?? undefined} onRetry={retry} />
	</div>
{:else}
	<!-- ready -->
	{#if showSettled && betting.lastSettled}
		<div class="flex flex-1 flex-col" transition:fly={{ y: 32, duration: 250 }}>
			<SettledView
				payload={betting.lastSettled}
				journal={betting.overview?.journal ?? []}
				onDismiss={dismissSettled}
			/>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col" transition:fade={{ duration: 150 }}>
			{#if nats.isReconnecting}
				<ConnectionBanner />
			{/if}

			<div class="min-h-0 flex-1 overflow-hidden">
				<MarketView
					market={betting.nextMarket}
					overview={betting.overview}
					onPlaceBet={handlePlaceBet}
					placing={betting.placingBet}
					betError={betting.error}
				/>
			</div>

			<ParticipantList {participants} />
		</div>
	{/if}
{/if}
