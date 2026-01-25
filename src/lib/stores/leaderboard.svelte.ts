export interface LeaderboardEntry {
	userId: string;
	tagNumber: number;
	displayName?: string;
	previousTagNumber?: number; // for movement indicator
}

export interface LeaderboardSnapshot {
	id: string;
	guildId: string;
	version: number;
	lastUpdated: string;
	entries: LeaderboardEntry[];
}

type PatchOperation =
	| { op: 'upsert_entry'; entry: LeaderboardEntry }
	| { op: 'remove_entry'; userId: string }
	| { op: 'swap_tags'; userIdA: string; userIdB: string }
	| { op: 'replace_snapshot'; snapshot: LeaderboardSnapshot };

class LeaderboardService {
	// State
	snapshot = $state<LeaderboardSnapshot | null>(null);
	version = $state(0);
	isLoading = $state(false);
	lastError = $state<string | null>(null);

	// Derived
	entries = $derived(this.snapshot?.entries ?? []);

	sortedEntries = $derived([...this.entries].sort((a, b) => a.tagNumber - b.tagNumber));

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
					this.snapshot.entries[idx] = patch.entry;
				} else {
					this.snapshot.entries.push(patch.entry);
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
}

export const leaderboardService = new LeaderboardService();
