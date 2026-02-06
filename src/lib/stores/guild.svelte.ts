import { auth } from './auth.svelte';
import { config } from '$lib/config';

interface GuildInfo {
	id: string;
	name: string;
	icon?: string;
}

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
			console.log('[GuildService] Loading from cache:', cached);
			this.info = cached;
			// Background refresh
			this.fetchFromApi(this.id).then((fresh) => {
				if (fresh) {
					console.log('[GuildService] Background refresh success:', fresh);
					this.info = fresh;
					this.cacheGuild(fresh);
				} else {
					console.log('[GuildService] Background refresh failed or no change');
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

			console.log('[GuildService] Fetch result:', info);
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
			// Try club endpoint first (new system)
			let response = await fetch(`${config.api.url}/clubs/${id}`);
			
			// If not found, try legacy guild endpoint
			if (!response.ok) {
				response = await fetch(`${config.api.url}/guilds/${id}`);
			}

			if (!response.ok) return null;

			const data = await response.json();
			return {
				id: id,
				name: data.name,
				icon: data.icon_url || data.icon
			};
		} catch (e) {
			console.error('Failed to fetch guild info:', e);
			return null;
		}
	}

	private getCachedGuild(id: string): GuildInfo | null {
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
		localStorage.setItem(`guild:${guild.id}`, JSON.stringify(guild));
	}

	clear(): void {
		this.info = null;
	}
}

export const guildService = new GuildService();
