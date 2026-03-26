import { nats } from './nats.svelte';
import { roundService, type RoundRaw } from './round.svelte';
import { leaderboardService, type LeaderboardResponseRaw } from './leaderboard.svelte';
import { roundActionsService } from './roundActions.svelte';
import { tagStore, type TagListResponseRaw } from './tags.svelte';
import { challengeStore } from './challenges.svelte';
import { auth } from './auth.svelte';
import { userProfiles, type UserProfileRaw } from './userProfiles.svelte';
import { betting, type BettingMarketSnapshot } from './betting.svelte';
import { log } from '$lib/config';

// Update response type for rounds
interface RoundListResponseRaw {
	rounds: RoundRaw[];
	profiles?: Record<string, UserProfileRaw>;
}

class DataLoader {
	loading = $state(false);
	error = $state<string | null>(null);
	private initialLoadPromise: Promise<void> | null = null;
	private initialLoadId: string | null = null;

	/**
	 * Request initial data snapshots after NATS connection established
	 */
	async loadInitialData(): Promise<void> {
		const user = auth.user;
		if (!user || !nats.isConnected) {
			log('DataLoader: Cannot load - no user or not connected');
			return;
		}

		const clubUuid = user.activeClubUuid;
		const guildId = user.guildId;
		const preferredId = clubUuid || guildId;

		if (!preferredId) {
			log('DataLoader: Cannot load - no club or guild ID');
			return;
		}

		if (this.initialLoadPromise) {
			if (this.initialLoadId === preferredId) {
				return this.initialLoadPromise;
			}
			await this.initialLoadPromise;
		}

		const loadPromise = this.loadInitialDataForId(preferredId, clubUuid, guildId);
		this.initialLoadPromise = loadPromise;
		this.initialLoadId = preferredId;

		try {
			await loadPromise;
		} finally {
			if (this.initialLoadPromise === loadPromise) {
				this.initialLoadPromise = null;
				this.initialLoadId = null;
			}
		}
	}

	/**
	 * Force a data reload
	 */
	async reload(): Promise<void> {
		this.initialLoadPromise = null;
		await this.loadInitialData();
	}

	/**
	 * Refresh only the betting snapshot. Used when a new betting market is
	 * created so we avoid reloading unrelated data (rounds, leaderboard, etc).
	 */
	async refreshBettingSnapshot(): Promise<void> {
		const user = auth.user;
		if (!user || !nats.isConnected) return;
		const clubUuid = user.activeClubUuid;
		if (!clubUuid) return;
		await this.loadBettingSnapshot(clubUuid);
	}

	private async loadInitialDataForId(
		preferredId: string,
		clubUuid: string,
		guildId: string
	): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			await Promise.all([
				this.loadRounds(preferredId, clubUuid, guildId),
				this.loadLeaderboard(preferredId, clubUuid, guildId),
				this.loadTagList(preferredId, guildId, clubUuid),
				this.loadChallenges(preferredId),
				...(clubUuid ? [this.loadBettingSnapshot(clubUuid, preferredId)] : [])
			]);
			log('DataLoader: Initial data loaded successfully');
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load data';
			log('DataLoader: Error loading initial data', e);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Returns true when the active identity still matches the one that kicked off a load.
	 * Guards against stale NATS responses arriving after reload() or a club switch.
	 */
	private isStillActive(expectedId: string): boolean {
		const user = auth.user;
		const currentId = user?.activeClubUuid || user?.guildId;
		return currentId === expectedId;
	}

	private async loadRounds(subjectId: string, clubUuid: string, guildId: string): Promise<void> {
		roundService.setLoading(true);

		try {
			// Request rounds snapshot via NATS request/reply
			// Backend returns snake_case format
			// We send both guild_id (legacy) and club_uuid (new) separately
			const response = await nats.request<
				{ guild_id: string; club_uuid: string },
				RoundListResponseRaw
			>(
				`round.list.request.v2.${subjectId}`,
				{ guild_id: guildId, club_uuid: clubUuid },
				{ timeout: 5000 }
			);

			if (!this.isStillActive(subjectId)) {
				log('DataLoader: Discarding stale rounds response for', subjectId);
				return;
			}
			if (response?.rounds) {
				roundService.setRoundsFromApi(response.rounds);
				roundActionsService.reconcileAllFromSnapshot();
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

	private async loadLeaderboard(
		subjectId: string,
		clubUuid: string,
		guildId: string
	): Promise<void> {
		leaderboardService.setLoading(true);

		try {
			// Request leaderboard snapshot via NATS request/reply
			// Backend returns snake_case format
			const response = await nats.request<
				{ guild_id: string; club_uuid: string },
				LeaderboardResponseRaw
			>(
				`leaderboard.snapshot.request.v2.${subjectId}`,
				{ guild_id: guildId, club_uuid: clubUuid },
				{ timeout: 5000 }
			);

			if (!this.isStillActive(subjectId)) {
				log('DataLoader: Discarding stale leaderboard response for', subjectId);
				return;
			}
			if (response?.leaderboard !== undefined) {
				leaderboardService.setSnapshotFromApi(response);
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

	private async loadTagList(subjectId: string, guildId: string, clubUuid?: string): Promise<void> {
		tagStore.setLoading(true);

		try {
			const payload: { guild_id: string; club_uuid?: string } = {
				guild_id: guildId,
				...(clubUuid ? { club_uuid: clubUuid } : {})
			};

			const response = await nats.request<
				{ guild_id: string; club_uuid?: string },
				TagListResponseRaw
			>(`leaderboard.tag.list.requested.v1.${subjectId}`, payload, { timeout: 5000 });

			if (!this.isStillActive(subjectId)) {
				log('DataLoader: Discarding stale tag list response for', subjectId);
				return;
			}
			if (response?.members) {
				tagStore.applyTagListResponse(response);
			}
			if (response?.profiles) {
				userProfiles.setProfilesFromApi(response.profiles);
			}
		} catch (e) {
			// Non-fatal: tag list will be fetched on-demand from the tags page
			log('DataLoader: Tag list snapshot request failed, will retry on-demand', e);
		} finally {
			tagStore.setLoading(false);
		}
	}

	private async loadChallenges(expectedId?: string): Promise<void> {
		try {
			await challengeStore.loadBoard();
			if (expectedId && !this.isStillActive(expectedId)) {
				log('DataLoader: Discarding stale challenges response for', expectedId);
				challengeStore.reset();
			}
		} catch (error) {
			log('DataLoader: Challenge board request failed, relying on events', error);
		}
	}

	private async loadBettingSnapshot(clubUuid: string, expectedId?: string): Promise<void> {
		// Only request snapshot if betting is accessible (enabled or frozen).
		if (!betting.canLoad) return;

		try {
			const response = await nats.request<{ club_uuid: string }, BettingMarketSnapshot>(
				`betting.snapshot.request.v1.${clubUuid}`,
				{ club_uuid: clubUuid },
				{ timeout: 5000 }
			);

			if (expectedId && !this.isStillActive(expectedId)) {
				log('DataLoader: Discarding stale betting snapshot for', expectedId);
				return;
			}
			if (response) {
				betting.setNextMarketFromSnapshot(response);
			}
		} catch (e) {
			// Non-fatal: market will arrive via betting.market.generated.v1 subscription.
			log('DataLoader: Betting snapshot request failed, relying on events', e);
		}
	}

	reset(): void {
		this.initialLoadPromise = null;
		this.initialLoadId = null;
		this.loading = false;
		this.error = null;
	}

	clearData(): void {
		this.reset();
		roundService.clear();
		leaderboardService.clear();
		userProfiles.clear();
		tagStore.reset();
		challengeStore.reset();
	}
}

export const dataLoader = new DataLoader();
