import type { UserProfileRaw } from './userProfiles.svelte';
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
	viewMode = $state<'tags' | 'season'>('tags');

	// Derived
	entries = $derived(this.snapshot?.entries ?? []);

	sortedEntries = $derived([...this.entries].sort((a, b) => a.tagNumber - b.tagNumber));

	sortedByPoints = $derived(
		[...this.entries].sort(
			(a, b) =>
				b.totalPoints - a.totalPoints ||
				b.roundsPlayed - a.roundsPlayed ||
				a.tagNumber - b.tagNumber
		)
	);

	currentView = $derived(this.viewMode === 'tags' ? this.sortedEntries : this.sortedByPoints);

	topTen = $derived(this.sortedEntries.slice(0, 10));

	hasData = $derived(this.snapshot !== null);

	// Methods
	setSnapshot(snapshot: LeaderboardSnapshot): void {
		this.snapshot = snapshot;
		this.version = snapshot.version;
	}

	applyPatch(patch: PatchOperation): void {
		if (!this.snapshot) return;

		switch (patch.op) {
			case 'upsert_entry': {
				const idx = this.snapshot.entries.findIndex((e) => e.userId === patch.entry.userId);
				if (idx >= 0) {
					this.snapshot.entries[idx] = { ...this.snapshot.entries[idx], ...patch.entry };
				} else {
					this.snapshot.entries.push({
						tagNumber: 0,
						totalPoints: 0,
						roundsPlayed: 0,
						...patch.entry
					} as LeaderboardEntry);
				}
				this.version++;
				break;
			}

			case 'remove_entry': {
				this.snapshot.entries = this.snapshot.entries.filter((e) => e.userId !== patch.userId);
				this.version++;
				break;
			}

			case 'swap_tags': {
				const entryA = this.snapshot.entries.find((e) => e.userId === patch.userIdA);
				const entryB = this.snapshot.entries.find((e) => e.userId === patch.userIdB);
				if (entryA && entryB) {
					const tempTag = entryA.tagNumber;
					entryA.previousTagNumber = entryA.tagNumber;
					entryB.previousTagNumber = entryB.tagNumber;
					entryA.tagNumber = entryB.tagNumber;
					entryB.tagNumber = tempTag;
					this.version++;
				}
				break;
			}

			case 'replace_snapshot': {
				this.setSnapshot(patch.snapshot);
				break;
			}
		}
	}

	setViewMode(mode: 'tags' | 'season'): void {
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
	 * @param entries Array of LeaderboardEntryDTO from API
	 * @param guildId The guild ID
	 */
	setSnapshotFromApi(entries: LeaderboardEntryDTO[], guildId: string): void {
		this.snapshot = transformLeaderboardEntries(entries, guildId);
		this.version = this.snapshot.version;
	}
}

export const leaderboardService = new LeaderboardService();
