/**
 * Activity Betting Service
 *
 * Wraps the betting API for the Discord Activity context.
 * Calls the Go backend directly with Authorization: Bearer instead of cookies.
 * Reuses all types from the main betting store to avoid drift.
 */

import type {
	BettingOverview,
	BettingMarketSnapshot,
	BettingTicket,
	BettingMarket,
	BettingMarketOpenedPayload,
	BettingMarketLockedPayload,
	BettingMarketSettledPayload,
	BettingMarketVoidedPayload,
	BettingMarketSuspendedPayload
} from './betting.svelte';

export type {
	BettingOverview,
	BettingMarketSnapshot,
	BettingTicket,
	BettingMarketOpenedPayload,
	BettingMarketLockedPayload,
	BettingMarketSettledPayload,
	BettingMarketVoidedPayload,
	BettingMarketSuspendedPayload
} from './betting.svelte';

export type {
	BettingWalletSnapshot,
	BettingMemberSettings,
	BettingMarket,
	BettingMarketOption,
	BettingRound,
	BettingWalletJournalEntry
} from './betting.svelte';

import { activityApiUrl } from '$lib/activity-utils';

type BettingApiError = { code?: string; error?: string };

type PlaceBetInput = {
	roundId: string;
	selectionKey: string;
	stake: number;
	marketType: string;
};

/** Decode the active_club_uuid from a NATS ticket JWT payload (no signature verify). */
export function extractClubUuidFromTicket(ticket: string): string | null {
	try {
		const parts = ticket.split('.');
		if (parts.length < 2) return null;
		const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
		return (payload.active_club_uuid as string) ?? null;
	} catch {
		return null;
	}
}

export class ActivityBettingService {
	overview = $state<BettingOverview | null>(null);
	nextMarket = $state<BettingMarketSnapshot | null>(null);
	lastSettled = $state<BettingMarketSettledPayload | null>(null);
	loading = $state(false);
	placingBet = $state(false);
	error = $state<string | null>(null);
	errorCode = $state<string | null>(null);
	actionMessage = $state<string | null>(null);

	private authHeader: () => Record<string, string>;
	private apiBase: string;

	constructor(authHeader: () => Record<string, string>) {
		this.authHeader = authHeader;
		this.apiBase = activityApiUrl();
	}

	get canEdit() {
		const state = this.overview?.access_state;
		return state === 'enabled';
	}

	get canView() {
		const state = this.overview?.access_state;
		return state === 'enabled' || state === 'frozen';
	}

	async loadOverview(clubUuid: string): Promise<void> {
		if (!clubUuid) return;
		this.loading = true;
		this.error = null;
		this.errorCode = null;
		try {
			const res = await fetch(
				`${this.apiBase}/api/betting/overview?club_uuid=${encodeURIComponent(clubUuid)}`,
				{ headers: { Accept: 'application/json', ...this.authHeader() } }
			);
			const data = (await res.json().catch(() => null)) as BettingOverview | BettingApiError | null;
			if (!res.ok) {
				this.applyApiError(data);
				return;
			}
			this.overview = data as BettingOverview;
		} catch {
			this.error = 'Failed to load betting overview';
			this.errorCode = 'network_error';
		} finally {
			this.loading = false;
		}
	}

	async placeBet(clubUuid: string, input: PlaceBetInput): Promise<boolean> {
		if (!clubUuid || !this.canEdit || this.placingBet) return false;
		this.placingBet = true;
		this.actionMessage = null;
		this.error = null;
		this.errorCode = null;
		try {
			const idempotencyKey = crypto.randomUUID();
			const res = await fetch(`${this.apiBase}/api/betting/bets`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...this.authHeader() },
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
				this.applyApiError(data);
				return false;
			}
			this.actionMessage = 'Bet placed successfully.';
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

	// NATS event handlers — called by the Activity page when messages arrive.

	handleMarketOpened(payload: BettingMarketOpenedPayload, clubUuid: string): void {
		if (payload.club_uuid !== clubUuid) return;
		this.nextMarket = null;
		this.lastSettled = null;
		void this.loadOverview(clubUuid);
	}

	handleMarketLocked(payload: BettingMarketLockedPayload, clubUuid: string): void {
		if (payload.club_uuid !== clubUuid || !this.nextMarket) return;

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

	handleMarketSettled(payload: BettingMarketSettledPayload, clubUuid: string): void {
		if (payload.club_uuid !== clubUuid) return;
		this.lastSettled = payload;
		void this.loadOverview(clubUuid);
	}

	handleMarketVoided(payload: BettingMarketVoidedPayload, clubUuid: string): void {
		if (payload.club_uuid !== clubUuid || !this.nextMarket) return;

		const filtered = this.nextMarket.markets?.filter((m) => m.id !== payload.market_id);
		const singular =
			this.nextMarket.market?.id === payload.market_id ? undefined : this.nextMarket.market;

		if (!singular && (!filtered || filtered.length === 0)) {
			this.nextMarket = null;
		} else {
			this.nextMarket = { ...this.nextMarket, market: singular, markets: filtered };
		}
	}

	handleMarketSuspended(payload: BettingMarketSuspendedPayload, clubUuid: string): void {
		if (payload.club_uuid !== clubUuid || !this.nextMarket) return;

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

	clear(): void {
		this.overview = null;
		this.nextMarket = null;
		this.lastSettled = null;
		this.loading = false;
		this.placingBet = false;
		this.error = null;
		this.errorCode = null;
		this.actionMessage = null;
	}

	private applyApiError(data: BettingApiError | unknown | null): void {
		if (data && typeof data === 'object' && 'code' in data) {
			const err = data as BettingApiError;
			this.error = err.error ?? 'Request failed';
			this.errorCode = err.code ?? 'request_failed';
		} else {
			this.error = 'Request failed';
			this.errorCode = 'request_failed';
		}
	}
}
