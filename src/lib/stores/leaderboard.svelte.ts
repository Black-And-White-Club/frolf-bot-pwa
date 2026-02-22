import { userProfiles, type UserProfileRaw } from './userProfiles.svelte';
import type { LeaderboardEntryDTO } from '$lib/types/backend';

export interface LeaderboardEntry {
	userId: string;
	tagNumber: number;
	displayName?: string;
	previousTagNumber?: number; // for movement indicator
	totalPoints: number;
	roundsPlayed: number;
}

export interface LeaderboardSnapshot {
	id: string;
	guildId: string;
	version: number;
	lastUpdated: string;
	entries: LeaderboardEntry[];
}

// The backend sends LeaderboardData which is just an array of entries
// (not the full Leaderboard struct)
export interface LeaderboardResponseRaw {
	guild_id: string;
	leaderboard: LeaderboardEntryDTO[]; // LeaderboardData is just []LeaderboardEntry
	profiles?: Record<string, UserProfileRaw>;
}

// Transform raw API response to internal format
function transformLeaderboardEntries(
	entries: LeaderboardEntryDTO[],
	guildId: string
): LeaderboardSnapshot {
	return {
		id: guildId, // Use guildId as ID since backend doesn't send one
		guildId: guildId,
		version: 1,
		lastUpdated: new Date().toISOString(), // Backend doesn't provide this, use current time
		entries: (entries || []).map((entry) => ({
			userId: entry.user_id,
			tagNumber: entry.tag_number,
			totalPoints: entry.total_points,
			roundsPlayed: entry.rounds_played
		}))
	};
}

type PatchOperation =
	| { op: 'upsert_entry'; entry: Partial<LeaderboardEntry> & { userId: string } }
	| { op: 'remove_entry'; userId: string }
	| { op: 'swap_tags'; userIdA: string; userIdB: string }
	| { op: 'replace_snapshot'; snapshot: LeaderboardSnapshot };

class LeaderboardService {
	// State
	snapshot = $state<LeaderboardSnapshot | null>(null);
	version = $state(0);
	isLoading = $state(false);
	lastError = $state<string | null>(null);
	viewMode = $state<'tags' | 'points'>('tags');

	// Derived
	entries = $derived(this.snapshot?.entries ?? []);

	private sortedViews = $derived.by(() => {
		const sortedByTag = [...this.entries].sort((a, b) => a.tagNumber - b.tagNumber);
		const sortedByPoints = [...sortedByTag].sort(
			(a, b) =>
				b.totalPoints - a.totalPoints ||
				b.roundsPlayed - a.roundsPlayed ||
				a.tagNumber - b.tagNumber
		);
		return { sortedByTag, sortedByPoints };
	});

	sortedEntries = $derived(this.sortedViews.sortedByTag);

	sortedByPoints = $derived(this.sortedViews.sortedByPoints);

	currentView = $derived(this.viewMode === 'points' ? this.sortedByPoints : this.sortedEntries);

	topTen = $derived(this.sortedEntries.slice(0, 10));

	hasData = $derived(this.snapshot !== null);

	// Methods
	setSnapshot(snapshot: LeaderboardSnapshot): void {
		this.snapshot = snapshot;
		this.version = snapshot.version;
	}

	applyPatch(patch: PatchOperation): void {
		const currentSnapshot = this.snapshot;
		if (!currentSnapshot) {
			return;
		}

		const updateSnapshot = (entries: LeaderboardEntry[]) => {
			const nextVersion = this.version + 1;
			this.snapshot = {
				...currentSnapshot,
				entries,
				version: nextVersion,
				lastUpdated: new Date().toISOString()
			};
			this.version = nextVersion;
		};

		switch (patch.op) {
			case 'upsert_entry': {
				const idx = currentSnapshot.entries.findIndex(
					(entry) => entry.userId === patch.entry.userId
				);
				if (idx >= 0) {
					const nextEntries = currentSnapshot.entries.map((entry, index) =>
						index === idx ? { ...entry, ...patch.entry } : entry
					);
					updateSnapshot(nextEntries);
				} else {
					const nextEntries = [
						...currentSnapshot.entries,
						{
							tagNumber: 0,
							totalPoints: 0,
							roundsPlayed: 0,
							...patch.entry
						} as LeaderboardEntry
					];
					updateSnapshot(nextEntries);
				}
				break;
			}

			case 'remove_entry': {
				const nextEntries = currentSnapshot.entries.filter(
					(entry) => entry.userId !== patch.userId
				);
				updateSnapshot(nextEntries);
				break;
			}

			case 'swap_tags': {
				const entryA = currentSnapshot.entries.find((entry) => entry.userId === patch.userIdA);
				const entryB = currentSnapshot.entries.find((entry) => entry.userId === patch.userIdB);
				if (!entryA || !entryB) {
					break;
				}

				const entryANextTag = entryB.tagNumber;
				const entryBNextTag = entryA.tagNumber;
				const nextEntries = currentSnapshot.entries.map((entry) => {
					if (entry.userId === patch.userIdA) {
						return {
							...entry,
							previousTagNumber: entry.tagNumber,
							tagNumber: entryANextTag
						};
					}
					if (entry.userId === patch.userIdB) {
						return {
							...entry,
							previousTagNumber: entry.tagNumber,
							tagNumber: entryBNextTag
						};
					}
					return entry;
				});

				updateSnapshot(nextEntries);
				break;
			}

			case 'replace_snapshot': {
				this.setSnapshot(patch.snapshot);
				break;
			}
		}
	}

	setViewMode(mode: 'tags' | 'points'): void {
		this.viewMode = mode;
	}

	clear(): void {
		this.snapshot = null;
		this.version = 0;
		this.lastError = null;
	}

	// Helpers
	getEntryByUserId(userId: string): LeaderboardEntry | undefined {
		return this.entries.find((e) => e.userId === userId);
	}

	getEntryByTagNumber(tagNumber: number): LeaderboardEntry | undefined {
		return this.entries.find((e) => e.tagNumber === tagNumber);
	}

	getMovementIndicator(entry: LeaderboardEntry): 'up' | 'down' | 'same' {
		if (!entry.previousTagNumber) return 'same';
		if (entry.tagNumber < entry.previousTagNumber) return 'up';
		if (entry.tagNumber > entry.previousTagNumber) return 'down';
		return 'same';
	}

	// Data loading methods
	setLoading(loading: boolean): void {
		this.isLoading = loading;
	}

	/**
	 * Set snapshot from raw API response (snake_case format)
	 * @param response LeaderboardResponseRaw from API
	 */
	setSnapshotFromApi(response: LeaderboardResponseRaw): void {
		if (response.profiles) {
			userProfiles.setProfilesFromApi(response.profiles);
		}
		this.snapshot = transformLeaderboardEntries(response.leaderboard, response.guild_id);
		this.version = this.snapshot.version;
	}
}

export const leaderboardService = new LeaderboardService();
