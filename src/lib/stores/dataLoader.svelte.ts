import { nats } from './nats.svelte';
import { roundService, type RoundRaw } from './round.svelte';
import { leaderboardService, type LeaderboardResponseRaw } from './leaderboard.svelte';
import { tagStore, type TagListResponseRaw } from './tags.svelte';
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
				this.loadTagList(preferredId, guildId, clubUuid)
			]);
			log('DataLoader: Initial data loaded successfully');
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load data';
			log('DataLoader: Error loading initial data', e);
		} finally {
			this.loading = false;
		}
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
				`round.list.request.v1.${subjectId}`,
				{ guild_id: guildId, club_uuid: clubUuid },
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
				`leaderboard.snapshot.request.v1.${subjectId}`,
				{ guild_id: guildId, club_uuid: clubUuid },
				{ timeout: 5000 }
			);

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
		tagStore.history = [];
		tagStore.tagList = [];
	}
}

export const dataLoader = new DataLoader();
