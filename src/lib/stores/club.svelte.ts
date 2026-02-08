import { auth } from './auth.svelte';
import { log } from '$lib/config';


interface ClubInfo {
	id: string;
	name: string;
	icon?: string;
}

class ClubService {
	info = $state<ClubInfo | null>(null);
	knownClubs = $state<Record<string, ClubInfo>>({});
	loading = $state(false);

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

		// In development, clear cache to ensure fresh data
		// But don't clear in tests, so we can verify caching logic
		if (import.meta.env.DEV && !import.meta.env.TEST && typeof window !== 'undefined') {
			log('[ClubService] DEV mode: Clearing club cache');
			localStorage.removeItem(`club:${this.id}`);
		}

		// Check localStorage cache first
		const cached = this.getCachedClub(this.id);
		if (cached) {
			log('[ClubService] Loading from cache:', cached);
			this.updateState(cached);
			
			// Background refresh via NATS
			this.fetchFromNats(this.id).then((fresh) => {
				if (fresh) {
					log('[ClubService] Background refresh success:', fresh);
					this.updateState(fresh);
					this.cacheClub(fresh);
				}
			});
			return;
		}

		log('[ClubService] Fetching fresh data for:', this.id);
		this.loading = true;
		try {
			// NATS First Strategy (as requested)
			log('[ClubService] Requesting info via NATS...');
			const info = await this.fetchFromNats(this.id);
			
			if (info) {
				log('[ClubService] NATS fetch success:', info);
				this.updateState(info);
				this.cacheClub(info);
			} else {
				console.warn('[ClubService] NATS fetch failed or returned null');
				// Fallback to null if NATS fails
				this.info = null;
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
				this.fetchFromNats(id).then((info) => {
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
				`club.info.request.v1.${id}`,
				{ club_uuid: id },
				{ timeout: 3000 }
			);

			if (response) {
				return {
					id: response.uuid || id,
					name: response.name,
					icon: response.icon_url || response.icon
				};
			}
		} catch (e) {
			console.warn(`[ClubService] NATS fetch failed for ${id}:`, e);
		}
		return null;
	}


	private getCachedClub(id: string): ClubInfo | null {
		if (typeof window === 'undefined') return null;
		const cached = localStorage.getItem(`club:${id}`);
		if (!cached) return null;
		try {
			return JSON.parse(cached);
		} catch {
			return null;
		}
	}

	private cacheClub(club: ClubInfo): void {
		if (typeof window === 'undefined') return;
		localStorage.setItem(`club:${club.id}`, JSON.stringify(club));
	}

	clear(): void {
		this.info = null;
	}
}

export const clubService = new ClubService();
