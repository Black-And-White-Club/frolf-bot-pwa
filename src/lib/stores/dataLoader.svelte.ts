import { nats } from './nats.svelte';
import { roundService, type RoundRaw } from './round.svelte';
import { leaderboardService, type LeaderboardResponseRaw } from './leaderboard.svelte';
import { auth } from './auth.svelte';
import { userProfiles, type UserProfileRaw } from './userProfiles.svelte';
import { log } from '$lib/config';

// Update response type for rounds
interface RoundListResponseRaw {
    rounds: RoundRaw[];
    profiles?: Record<string, UserProfileRaw>;
}

class DataLoader {
	loading = $state(false);
	error = $state<string | null>(null);

	/**
	 * Request initial data snapshots after NATS connection established
	 */
	async loadInitialData(): Promise<void> {
		const guildId = auth.user?.guildId;
		if (!guildId || !nats.isConnected) {
			log('DataLoader: Cannot load - no guild or not connected');
			return;
		}

		this.loading = true;
		this.error = null;

		try {
			await Promise.all([this.loadRounds(guildId), this.loadLeaderboard(guildId)]);
			log('DataLoader: Initial data loaded successfully');
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load data';
			log('DataLoader: Error loading initial data', e);
		} finally {
			this.loading = false;
		}
	}

	private async loadRounds(guildId: string): Promise<void> {
		roundService.setLoading(true);

		try {
			// Request rounds snapshot via NATS request/reply
			// Backend returns snake_case format
			const response = await nats.request<{ guild_id: string }, RoundListResponseRaw>(
				`round.list.request.v1.${guildId}`,
				{ guild_id: guildId },
				{ timeout: 5000 }
			);

			if (response?.rounds) {
				roundService.setRoundsFromApi(response.rounds);
			}
			// Store profiles if included
			if (response?.profiles) {
				userProfiles.setProfilesFromApi(response.profiles);
			}
		} catch (e) {
			// If request fails, we'll get data via subscriptions
			log('DataLoader: Round snapshot request failed, relying on events', e);
		} finally {
			roundService.setLoading(false);
		}
	}

	private async loadLeaderboard(guildId: string): Promise<void> {
		leaderboardService.setLoading(true);

		try {
			// Request leaderboard snapshot via NATS request/reply
			// Backend returns snake_case format
			const response = await nats.request<
				{ guild_id: string },
				LeaderboardResponseRaw
			>(`leaderboard.snapshot.request.v1.${guildId}`, { guild_id: guildId }, { timeout: 5000 });

			if (response?.leaderboard) {
				leaderboardService.setSnapshotFromApi(response.leaderboard, guildId);
			}
			// Store profiles if included
			if (response?.profiles) {
				userProfiles.setProfilesFromApi(response.profiles);
			}
		} catch (e) {
			// If request fails, we'll get data via subscriptions
			log('DataLoader: Leaderboard snapshot request failed, relying on events', e);
		} finally {
			leaderboardService.setLoading(false);
		}
	}

	reset(): void {
		this.loading = false;
		this.error = null;
	}
}

export const dataLoader = new DataLoader();
