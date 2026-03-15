import { auth } from './auth.svelte';

export type BettingWalletSnapshot = {
	season_points: number;
	adjustment_balance: number;
	available: number;
	reserved: number;
};

export type BettingMemberSettings = {
	opt_out_targeting: boolean;
	updated_at: string;
};

export type BettingWalletJournalEntry = {
	id: number;
	entry_type: string;
	amount: number;
	reason: string;
	created_at: string;
};

export type BettingTicket = {
	id: number;
	round_id: string;
	market_type: string;
	selection_key: string;
	selection_label: string;
	stake: number;
	decimal_odds: number;
	potential_payout: number;
	settled_payout: number;
	status: string;
	settled_at: string | null;
	created_at: string;
};

export type BettingMarketOption = {
	option_key: string;
	member_id: string;
	label: string;
	probability_percent: number;
	decimal_odds: number;
	self_bet_restricted?: boolean;
	metadata?: string;
};

export type BettingMarket = {
	id: number;
	type: string;
	title: string;
	status: string;
	locks_at: string;
	ephemeral: boolean;
	result?: string;
	options: BettingMarketOption[];
};

export type BettingRound = {
	id: string;
	title: string;
	start_time: string;
};

/** Public (non-user-specific) market snapshot. Delivered via NATS request/reply. */
export type BettingMarketSnapshot = {
	club_uuid: string;
	guild_id: string;
	season_id: string;
	access_state: string;
	round?: BettingRound;
	market?: BettingMarket;
	markets?: BettingMarket[];
};

/** Per-user view returned by the HTTP /api/betting/overview endpoint. */
export type BettingOverview = {
	club_uuid: string;
	guild_id: string;
	season_id: string;
	season_name: string;
	access_state: string;
	access_source: string;
	read_only: boolean;
	wallet: BettingWalletSnapshot;
	settings: BettingMemberSettings;
	journal: BettingWalletJournalEntry[];
};

type BettingApiError = {
	code?: string;
	error?: string;
};

type UpdateSettingsInput = {
	optOutTargeting: boolean;
};

type PlaceBetInput = {
	roundId: string;
	selectionKey: string;
	stake: number;
	marketType: string;
};

// ---------------------------------------------------------------------------
// Event payloads (mirrors frolf-bot-shared/events/betting types)
// ---------------------------------------------------------------------------

export type BettingMarketOpenedPayload = {
	guild_id: string;
	club_uuid: string;
	round_id: string;
	market_id: number;
	market_type: string;
};

export type BettingMarketLockedPayload = {
	guild_id: string;
	club_uuid: string;
	round_id: string;
	market_id: number;
};

export type BettingMarketSettledPayload = {
	guild_id: string;
	club_uuid: string;
	round_id: string;
	market_id: number;
	result_summary: string;
	settlement_version: number;
};

export type BettingMarketVoidedPayload = {
	guild_id: string;
	club_uuid: string;
	round_id: string;
	market_id: number;
	reason: string;
};

export type BettingMarketSuspendedPayload = {
	guild_id: string;
	club_uuid: string;
	round_id: string;
	market_id: number;
	reason?: string;
};

export class BettingService {
	overview = $state<BettingOverview | null>(null);
	/** Public market snapshot — received via NATS, not HTTP. */
	nextMarket = $state<BettingMarketSnapshot | null>(null);
	loading = $state(false);
	savingSettings = $state(false);
	placingBet = $state(false);
	error = $state<string | null>(null);
	errorCode = $state<string | null>(null);
	actionMessage = $state<string | null>(null);
	private loadPromise: Promise<BettingOverview | null> | null = null;
	private loadClubUuid: string | null = null;

	access = $derived(auth.bettingAccess);
	currentClubUuid = $derived(auth.user?.activeClubUuid ?? null);
	canLoad = $derived(this.access.state === 'enabled' || this.access.state === 'frozen');
	canEdit = $derived(this.access.state === 'enabled');

	async loadOverview(clubUuid = this.currentClubUuid): Promise<BettingOverview | null> {
		if (!clubUuid || !this.canLoad) {
			this.clear();
			return null;
		}

		if (this.loadPromise && this.loadClubUuid === clubUuid) {
			return this.loadPromise;
		}

		const request = this.fetchOverview(clubUuid);
		this.loadPromise = request;
		this.loadClubUuid = clubUuid;

		try {
			return await request;
		} finally {
			if (this.loadPromise === request) {
				this.loadPromise = null;
				this.loadClubUuid = null;
			}
		}
	}

	// -------------------------------------------------------------------------
	// NATS event handlers — called by subscriptions.svelte.ts
	// -------------------------------------------------------------------------

	/** Called by dataLoader after the NATS snapshot request/reply completes. */
	setNextMarketFromSnapshot(snapshot: BettingMarketSnapshot | null): void {
		this.nextMarket = snapshot;
	}

	/** betting.market.generated.v1 — a new market was created for this club. */
	handleMarketOpened(payload: BettingMarketOpenedPayload): void {
		if (payload.club_uuid !== this.currentClubUuid) return;
		// The snapshot doesn't carry full market data, so request a refresh by
		// clearing and letting dataLoader request a new snapshot. For now we
		// mark nextMarket dirty so the UI knows to expect an update.
		// If nextMarket is already set for this club, leave it; the snapshot
		// will be requested on the next dataLoader cycle. For immediate UX,
		// if club matches we clear to trigger a re-bootstrap.
		if (this.nextMarket && this.nextMarket.club_uuid === payload.club_uuid) {
			// Signal that a new market is incoming — dataLoader will push a fresh snapshot.
			this.nextMarket = null;
		}
	}

	/** betting.market.locked.v1 — market is locked, no new bets. */
	handleMarketLocked(payload: BettingMarketLockedPayload): void {
		if (payload.club_uuid !== this.currentClubUuid) return;
		if (!this.nextMarket) return;

		const updateMarket = (m: BettingMarket) =>
			m.id === payload.market_id ? { ...m, status: 'locked' } : m;

		this.nextMarket = {
			...this.nextMarket,
			market: this.nextMarket.market
				? updateMarket(this.nextMarket.market)
				: this.nextMarket.market,
			markets: this.nextMarket.markets?.map(updateMarket)
		};
	}

	/** betting.market.settled.v1 — market settled; reload wallet. */
	handleMarketSettled(payload: BettingMarketSettledPayload): void {
		if (payload.club_uuid !== this.currentClubUuid) return;
		if (!this.nextMarket) return;

		const updateMarket = (m: BettingMarket) =>
			m.id === payload.market_id ? { ...m, status: 'settled', result: payload.result_summary } : m;

		this.nextMarket = {
			...this.nextMarket,
			market: this.nextMarket.market
				? updateMarket(this.nextMarket.market)
				: this.nextMarket.market,
			markets: this.nextMarket.markets?.map(updateMarket)
		};

		// Per-user wallet/tickets may have changed — reload overview.
		void this.loadOverview();
	}

	/** betting.market.voided.v1 — market voided; clear matching market. */
	handleMarketVoided(payload: BettingMarketVoidedPayload): void {
		if (payload.club_uuid !== this.currentClubUuid) return;
		if (!this.nextMarket) return;

		const filtered = this.nextMarket.markets?.filter((m) => m.id !== payload.market_id);
		const singular =
			this.nextMarket.market?.id === payload.market_id ? undefined : this.nextMarket.market;

		if (!singular && (!filtered || filtered.length === 0)) {
			this.nextMarket = null;
		} else {
			this.nextMarket = { ...this.nextMarket, market: singular, markets: filtered };
		}
	}

	/** betting.market.suspended.v1 — market temporarily suspended. */
	handleMarketSuspended(payload: BettingMarketSuspendedPayload): void {
		if (payload.club_uuid !== this.currentClubUuid) return;
		if (!this.nextMarket) return;

		const updateMarket = (m: BettingMarket) =>
			m.id === payload.market_id ? { ...m, status: 'suspended' } : m;

		this.nextMarket = {
			...this.nextMarket,
			market: this.nextMarket.market
				? updateMarket(this.nextMarket.market)
				: this.nextMarket.market,
			markets: this.nextMarket.markets?.map(updateMarket)
		};
	}

	// -------------------------------------------------------------------------
	// HTTP mutations (wallet/bets stay behind HTTP)
	// -------------------------------------------------------------------------

	async placeBet(input: PlaceBetInput): Promise<boolean> {
		const clubUuid = this.currentClubUuid;
		if (!clubUuid || !this.canEdit) {
			return false;
		}

		if (this.placingBet) return false;
		this.placingBet = true;
		this.actionMessage = null;
		this.error = null;
		this.errorCode = null;

		try {
			const idempotencyKey = crypto.randomUUID();
			const res = await fetch('/api/betting/bets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					club_uuid: clubUuid,
					round_id: input.roundId,
					selection_key: input.selectionKey,
					stake: input.stake,
					market_type: input.marketType,
					idempotency_key: idempotencyKey
				})
			});

			const data = (await res.json().catch(() => null)) as BettingTicket | BettingApiError | null;
			if (!res.ok) {
				this.applyApiError(data, 'Failed to place bet');
				return false;
			}

			this.actionMessage = 'Bet placed successfully.';
			// Wallet updated by server — reload overview for fresh balance/tickets.
			await this.loadOverview(clubUuid);
			return true;
		} catch {
			this.error = 'Failed to place bet';
			this.errorCode = 'network_error';
			return false;
		} finally {
			this.placingBet = false;
		}
	}

	async updateSettings(input: UpdateSettingsInput): Promise<boolean> {
		const clubUuid = this.currentClubUuid;
		if (!clubUuid || !this.canEdit) return false;

		this.savingSettings = true;
		this.actionMessage = null;
		this.error = null;
		this.errorCode = null;

		try {
			const res = await fetch('/api/betting/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ club_uuid: clubUuid, opt_out_targeting: input.optOutTargeting })
			});

			const data = (await res.json().catch(() => null)) as
				| BettingMemberSettings
				| BettingApiError
				| null;

			if (!res.ok) {
				this.applyApiError(data, 'Failed to update settings');
				return false;
			}

			if (data && 'opt_out_targeting' in data && this.overview) {
				this.overview = { ...this.overview, settings: data };
			}

			this.actionMessage = 'Settings saved.';
			return true;
		} catch {
			this.error = 'Failed to update settings';
			this.errorCode = 'network_error';
			return false;
		} finally {
			this.savingSettings = false;
		}
	}

	clear(): void {
		this.overview = null;
		this.nextMarket = null;
		this.loading = false;
		this.savingSettings = false;
		this.placingBet = false;
		this.error = null;
		this.errorCode = null;
		this.actionMessage = null;
		this.loadPromise = null;
		this.loadClubUuid = null;
	}

	private async fetchOverview(clubUuid: string): Promise<BettingOverview | null> {
		this.loading = true;
		this.error = null;
		this.errorCode = null;

		try {
			const res = await fetch(`/api/betting/overview?club_uuid=${encodeURIComponent(clubUuid)}`, {
				headers: {
					Accept: 'application/json'
				}
			});

			const data = (await res.json().catch(() => null)) as BettingOverview | BettingApiError | null;
			if (!res.ok) {
				this.applyApiError(data, 'Failed to load betting overview');
				if (res.status === 403 && this.errorCode === 'feature_disabled') {
					this.overview = null;
				}
				return null;
			}

			if (!data || !('wallet' in data)) {
				this.error = 'Failed to load betting overview';
				this.errorCode = 'invalid_response';
				return null;
			}

			this.overview = data;
			return data;
		} catch {
			this.error = 'Failed to load betting overview';
			this.errorCode = 'network_error';
			return null;
		} finally {
			this.loading = false;
		}
	}

	private applyApiError(
		data: BettingApiError | BettingMemberSettings | BettingOverview | BettingTicket | null,
		fallback: string
	): void {
		if (data && 'error' in data) {
			this.error = (data as BettingApiError).error || fallback;
			this.errorCode = (data as BettingApiError).code || 'request_failed';
			return;
		}

		this.error = fallback;
		this.errorCode = 'request_failed';
	}
}

export const betting = new BettingService();
