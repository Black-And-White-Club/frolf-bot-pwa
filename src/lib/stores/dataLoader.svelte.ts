import { nats } from './nats.svelte';
import { roundService } from './round.svelte';
import { leaderboardService } from './leaderboard.svelte';
import { auth } from './auth.svelte';
import { log } from '$lib/config';
import type { Round } from './round.svelte';
import type { LeaderboardSnapshot } from './leaderboard.svelte';

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
			const response = await nats.request<{ guild_id: string }, { rounds: Round[] }>(
				`round.list.request.v1.${guildId}`,
				{ guild_id: guildId },
				{ timeout: 5000 }
			);

			if (response?.rounds) {
				roundService.setRounds(response.rounds);
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
			const response = await nats.request<
				{ guild_id: string },
				{ leaderboard: LeaderboardSnapshot }
			>(`leaderboard.snapshot.request.v1.${guildId}`, { guild_id: guildId }, { timeout: 5000 });

			if (response?.leaderboard) {
				leaderboardService.setSnapshot(response.leaderboard);
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
