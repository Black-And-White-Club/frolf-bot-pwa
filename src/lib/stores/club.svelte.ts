import { auth } from './auth.svelte';


interface ClubInfo {
	id: string;
	name: string;
	icon?: string;
}

class ClubService {
	info = $state<ClubInfo | null>(null);
	loading = $state(false);

	// Preferred ID for current session (Club UUID or legacy Guild ID)
	id = $derived(auth.user?.activeClubUuid ?? auth.user?.guildId ?? null);

	/**
	 * Fetch club info from cache or API
	 * Called after auth is initialized
	 */
	async loadClubInfo(): Promise<void> {
		if (!this.id) {
			console.log('[ClubService] No ID available to load');
			return;
		}

		// In development, clear cache to ensure fresh data
		// But don't clear in tests, so we can verify caching logic
		if (import.meta.env.DEV && !import.meta.env.TEST && typeof window !== 'undefined') {
			console.log('[ClubService] DEV mode: Clearing club cache');
			localStorage.removeItem(`club:${this.id}`);
		}

		// Check localStorage cache first
		const cached = this.getCachedClub(this.id);
		if (cached) {
			console.log('[ClubService] Loading from cache:', cached);
			this.info = cached;
			// Background refresh via NATS
			this.fetchFromNats(this.id).then((fresh) => {
				if (fresh) {
					console.log('[ClubService] Background refresh success:', fresh);
					this.info = fresh;
					this.cacheClub(fresh);
				}
			});
			return;
		}

		console.log('[ClubService] Fetching fresh data for:', this.id);
		this.loading = true;
		try {
			// NATS First Strategy (as requested)
			console.log('[ClubService] Requesting info via NATS...');
			const info = await this.fetchFromNats(this.id);
			
			if (info) {
				console.log('[ClubService] NATS fetch success:', info);
				this.info = info;
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

	private async fetchFromNats(id: string): Promise<ClubInfo | null> {
		try {
			// Dynamic import to avoid circular dependency (nats -> auth -> club)
			const { nats } = await import('./nats.svelte');
			if (!nats.isConnected) return null;

			console.log(`[ClubService] Requesting club info via NATS: club.info.request.v1.${id}`);
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
			console.warn('[ClubService] NATS fetch failed:', e);
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
