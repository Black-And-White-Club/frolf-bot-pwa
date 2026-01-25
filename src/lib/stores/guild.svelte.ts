import { auth } from './auth.svelte';

interface GuildInfo {
	id: string;
	name: string;
	icon?: string;
}

class GuildService {
	info = $state<GuildInfo | null>(null);
	loading = $state(false);

	// Derived from auth
	guildId = $derived(auth.user?.guildId ?? null);

	/**
	 * Fetch guild info from cache or API
	 * Called after auth is initialized
	 */
	async loadGuildInfo(): Promise<void> {
		if (!this.guildId) return;

		// Check localStorage cache first
		const cached = this.getCachedGuild(this.guildId);
		if (cached) {
			this.info = cached;
			return;
		}

		this.loading = true;
		try {
			// For now, use placeholder - real implementation fetches from API
			// const response = await fetch(`${config.apiUrl}/guilds/${this.guildId}`);
			// const data = await response.json();

			this.info = {
				id: this.guildId,
				name: 'Disc Golf League', // Placeholder until API fetch
				icon: undefined
			};

			this.cacheGuild(this.info);
		} finally {
			this.loading = false;
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
