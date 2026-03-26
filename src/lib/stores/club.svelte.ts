import { auth } from './auth.svelte';
import { log, config } from '$lib/config';
import type { ResolvedClubEntitlements } from './auth.svelte';

interface ClubInfo {
	id: string;
	name: string;
	icon?: string;
	entitlements?: ResolvedClubEntitlements;
}

const CLUB_CACHE_TTL_MS = 3_600_000; // 1 hour

type CachedClubEntry = { data: ClubInfo; cached_at: number };

class ClubService {
	info = $state<ClubInfo | null>(null);
	knownClubs = $state<Record<string, ClubInfo>>({});
	loading = $state(false);
	private loadClubInfoPromise: Promise<void> | null = null;
	private loadClubInfoId: string | null = null;
	private pendingClubRequests = new Map<string, Promise<ClubInfo | null>>();

	// Preferred ID for current session (Club UUID or legacy Guild ID)
	id = $derived(auth.user?.activeClubUuid ?? auth.user?.guildId ?? null);

	/**
	 * Fetch club info from cache or API
	 * Called after auth is initialized
	 */
	async loadClubInfo(): Promise<void> {
		if (!this.id) {
			log('[ClubService] No ID available to load');
			return;
		}

		if (this.loadClubInfoPromise && this.loadClubInfoId === this.id) {
			return this.loadClubInfoPromise;
		}

		const targetId = this.id;
		const loadPromise = this.loadClubInfoForId(targetId);
		this.loadClubInfoPromise = loadPromise;
		this.loadClubInfoId = targetId;

		try {
			await loadPromise;
		} finally {
			if (this.loadClubInfoPromise === loadPromise) {
				this.loadClubInfoPromise = null;
				this.loadClubInfoId = null;
			}
		}
	}

	private async loadClubInfoForId(targetId: string): Promise<void> {
		if (!targetId) return;

		// In development, clear cache to ensure fresh data
		// But don't clear in tests, so we can verify caching logic
		if (import.meta.env.DEV && !import.meta.env.TEST && typeof window !== 'undefined') {
			log('[ClubService] DEV mode: Clearing club cache');
			localStorage.removeItem(`club:${targetId}`);
		}

		// Check localStorage cache first
		const cached = this.getCachedClub(targetId);
		if (cached) {
			log('[ClubService] Loading from cache:', cached);
			this.updateState(cached);

			// Background refresh via NATS
			this.fetchFromNatsDeduped(targetId).then((fresh) => {
				if (fresh) {
					log('[ClubService] Background refresh success:', fresh);
					this.updateState(fresh);
					this.cacheClub(fresh);
				}
			});
			return;
		}

		log('[ClubService] Fetching fresh data for:', targetId);
		this.loading = true;
		try {
			// NATS First Strategy (as requested)
			log('[ClubService] Requesting info via NATS...');
			const info = await this.fetchFromNatsDeduped(targetId);

			if (info) {
				log('[ClubService] NATS fetch success:', info);
				this.updateState(info);
				this.cacheClub(info);
			} else {
				// Fallback to API
				log('[ClubService] NATS failed, falling back to API...');
				const apiInfo = await this.fetchFromApi(targetId);
				if (apiInfo) {
					log('[ClubService] API fetch success:', apiInfo);
					this.updateState(apiInfo);
					this.cacheClub(apiInfo);
				} else {
					console.warn('[ClubService] All fetches failed');
					this.info = null;
				}
			}
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Ensure we have info for a list of clubs (e.g. for the dropdown)
	 */
	async ensureClubsLoaded(ids: string[]): Promise<void> {
		const missing = ids.filter((id) => !this.knownClubs[id]);
		if (missing.length === 0) return;

		// Check local storage for missing ones first
		for (const id of missing) {
			const cached = this.getCachedClub(id);
			if (cached) {
				this.updateState(cached);
			} else {
				// Fetch individual via NATS
				// Parallelize requests
				this.fetchFromNatsDeduped(id).then((info) => {
					if (info) {
						this.updateState(info);
						this.cacheClub(info);
					}
				});
			}
		}
	}

	private updateState(club: ClubInfo) {
		this.knownClubs[club.id] = club;
		if (club.id === this.id) {
			this.info = club;
		}
	}

	private async fetchFromNats(id: string): Promise<ClubInfo | null> {
		try {
			// Dynamic import to avoid circular dependency (nats -> auth -> club)
			const { nats } = await import('./nats.svelte');
			if (!nats.isConnected) return null;

			// Request club info via NATS
			const response = await nats.request<any, any>(
				`club.info.request.v2.${id}`,
				{ club_uuid: id },
				{ timeout: 3000 }
			);

			if (response) {
				return {
					id: response.uuid || id,
					name: response.name,
					icon: response.icon_url || response.icon,
					entitlements: response.entitlements
				};
			}
		} catch (e) {
			console.warn(`[ClubService] NATS fetch failed for ${id}:`, e);
		}
		return null;
	}

	private fetchFromNatsDeduped(id: string): Promise<ClubInfo | null> {
		const inFlight = this.pendingClubRequests.get(id);
		if (inFlight) {
			return inFlight;
		}

		const request = this.fetchFromNats(id).finally(() => {
			this.pendingClubRequests.delete(id);
		});
		this.pendingClubRequests.set(id, request);
		return request;
	}

	private async fetchFromApi(id: string): Promise<ClubInfo | null> {
		try {
			const headers: Record<string, string> = {
				Accept: 'application/json'
			};
			if (auth.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}

			const baseUrl = config.api.url || '';
			const url = `${baseUrl}/api/clubs/${id}`;

			const res = await fetch(url, { headers });
			if (res.ok) {
				const data = await res.json();
				return {
					id: data.id || data.uuid || id,
					name: data.name,
					icon: data.icon_url || data.icon,
					entitlements: data.entitlements
				};
			}
		} catch (e) {
			console.warn(`[ClubService] API fetch failed for ${id}:`, e);
		}
		return null;
	}

	private getCachedClub(id: string): ClubInfo | null {
		if (typeof window === 'undefined') return null;
		const raw = localStorage.getItem(`club:${id}`);
		if (!raw) return null;
		try {
			const entry = JSON.parse(raw) as CachedClubEntry | ClubInfo;
			// Support both the new {data, cached_at} shape and legacy bare ClubInfo objects.
			if ('cached_at' in entry && 'data' in entry) {
				if (Date.now() - entry.cached_at > CLUB_CACHE_TTL_MS) {
					localStorage.removeItem(`club:${id}`);
					return null;
				}
				return entry.data;
			}
			// Legacy cache entry without TTL — treat as expired.
			localStorage.removeItem(`club:${id}`);
			return null;
		} catch {
			return null;
		}
	}

	private cacheClub(club: ClubInfo): void {
		if (typeof window === 'undefined') return;
		const entry: CachedClubEntry = { data: club, cached_at: Date.now() };
		localStorage.setItem(`club:${club.id}`, JSON.stringify(entry));
	}

	clear(): void {
		this.loadClubInfoPromise = null;
		this.loadClubInfoId = null;
		this.pendingClubRequests.clear();
		this.info = null;
	}
}

export const clubService = new ClubService();
