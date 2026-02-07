import { auth } from './auth.svelte';
import { config } from '$lib/config';
import type { GuildInfo } from '$lib/types/backend';

interface CachedGuildInfo extends GuildInfo {
	lastUpdated: number;
}

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

class GuildService {
	info = $state<GuildInfo | null>(null);
	loading = $state(false);

	// Preferred ID for current session (Club UUID or legacy Guild ID)
	id = $derived(auth.user?.activeClubUuid ?? auth.user?.guildId ?? null);

	/**
	 * Fetch guild info from cache or API
	 * Called after auth is initialized
	 */
	async loadGuildInfo(): Promise<void> {
		if (!this.id) {
			console.log('[GuildService] No ID available to load');
			return;
		}

		// In development, clear cache to ensure fresh data
		// But don't clear in tests, so we can verify caching logic
		if (import.meta.env.DEV && !import.meta.env.TEST && typeof window !== 'undefined') {
			console.log('[GuildService] DEV mode: Clearing guild cache');
			localStorage.removeItem(`guild:${this.id}`);
		}

		// Check localStorage cache first
		const cached = this.getCachedGuild(this.id);
		if (cached) {
			this.info = { id: cached.id, name: cached.name, icon: cached.icon };
			
			// If cache is fresh, don't even background refresh
			const now = Date.now();
			if (now - cached.lastUpdated < CACHE_TTL) {
				console.log('[GuildService] Cache is fresh, skipping refresh');
				return;
			}

			console.log('[GuildService] Loading from cache (needs refresh):', cached);
			// Background refresh
			this.fetchFromApi(this.id).then((fresh) => {
				if (fresh) {
					console.log('[GuildService] Background refresh success:', fresh);
					this.info = fresh;
					this.cacheGuild(fresh);
				}
			});
			return;
		}

		console.log('[GuildService] Fetching fresh data for:', this.id);
		this.loading = true;
		try {
			// Try HTTP API first
			let info = await this.fetchFromApi(this.id);

			// If HTTP failed, try NATS (if connected)
			if (!info) {
				console.log('[GuildService] HTTP failed, trying NATS...');
				info = await this.fetchFromNats(this.id);
			}

			this.info = info || {
				id: this.id,
				name: 'Disc Golf League', // Fallback
				icon: undefined
			};
			this.cacheGuild(this.info);
		} finally {
			this.loading = false;
		}
	}

	private async fetchFromNats(id: string): Promise<GuildInfo | null> {
		try {
			// Dynamic import to avoid circular dependency (nats -> auth -> guild)
			const { nats } = await import('./nats.svelte');
			if (!nats.isConnected) return null;

			console.log(`[GuildService] Requesting guild info via NATS: guild.info.request.v1.${id}`);
			const response = await nats.request<any, any>(
				`guild.info.request.v1.${id}`,
				{ guild_id: id, club_uuid: id },
				{ timeout: 3000 }
			);

			if (response) {
				return {
					id: id,
					name: response.name,
					icon: response.icon_url || response.icon
				};
			}
		} catch (e) {
			console.warn('[GuildService] NATS fetch failed:', e);
		}
		return null;
	}

	private async fetchFromApi(id: string): Promise<GuildInfo | null> {
		try {
			const headers: Record<string, string> = {
				'Accept': 'application/json'
			};
			if (auth.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}

			// Try club endpoint first (new system)
			let response = await fetch(`${config.api.url}/clubs/${id}`, { headers });

			// If not found, try legacy guild endpoint
			if (!response.ok) {
				response = await fetch(`${config.api.url}/guilds/${id}`, { headers });
			}

			if (!response.ok) return null;

			const data = await response.json();
			return {
				id: id,
				name: data.name,
				icon: data.icon_url || data.icon
			};
		} catch (e) {
			console.error('[GuildService] Failed to fetch guild info:', e);
			return null;
		}
	}

	private getCachedGuild(id: string): CachedGuildInfo | null {
		if (typeof window === 'undefined') return null;
		const cached = localStorage.getItem(`guild:${id}`);
		if (!cached) return null;
		try {
			return JSON.parse(cached);
		} catch {
			return null;
		}
	}

	private cacheGuild(guild: GuildInfo): void {
		if (typeof window === 'undefined') return;
		const toCache: CachedGuildInfo = {
			...guild,
			lastUpdated: Date.now()
		};
		localStorage.setItem(`guild:${guild.id}`, JSON.stringify(toCache));
	}

	clear(): void {
		this.info = null;
	}
}

export const guildService = new GuildService();

