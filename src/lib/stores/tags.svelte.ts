/**
 * Tag store — manages tag history, tag list, and chart data for the PWA.
 *
 * Mirrors the request-reply pattern established by the leaderboard store:
 * 1. Publish a request event via NATS
 * 2. Subscribe to the response topic
 * 3. Transform the raw payload into typed data structures
 */

export interface TagHistoryEntry {
	id: number;
	tagNumber: number;
	oldMemberId?: string;
	newMemberId: string;
	reason: string;
	roundId?: string;
	createdAt: string;
}

export interface TagListMember {
	memberId: string;
	currentTag: number | null;
	lastActiveAt?: string;
}

// Raw payloads from the backend (snake_case JSON)
export interface TagHistoryResponseRaw {
	guild_id: string;
	entries: Array<{
		id: number;
		tag_number: number;
		old_member_id?: string;
		new_member_id: string;
		reason: string;
		round_id?: string;
		created_at: string;
	}>;
}

export interface TagListResponseRaw {
	guild_id: string;
	members: Array<{
		member_id: string;
		current_tag: number | null;
		last_active_at?: string;
	}>;
}

function transformHistoryEntries(raw: TagHistoryResponseRaw): TagHistoryEntry[] {
	return raw.entries.map((e) => ({
		id: e.id,
		tagNumber: e.tag_number,
		oldMemberId: e.old_member_id,
		newMemberId: e.new_member_id,
		reason: e.reason,
		roundId: e.round_id,
		createdAt: e.created_at
	}));
}

function transformTagList(raw: TagListResponseRaw): TagListMember[] {
	return raw.members.map((m) => ({
		memberId: m.member_id,
		currentTag: m.current_tag,
		lastActiveAt: m.last_active_at
	}));
}

export class TagService {
	history = $state<TagHistoryEntry[]>([]);
	tagList = $state<TagListMember[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	selectedMemberId = $state<string | null>(null);

	selectMember(id: string | null) {
		this.selectedMemberId = id;
	}

	get memberList() {
		return this.tagList;
	}

	get selectedMemberHistory() {
		if (!this.selectedMemberId) return [];
		return this.history.filter(h => h.newMemberId === this.selectedMemberId);
	}

	applyHistoryResponse(raw: TagHistoryResponseRaw) {
		this.history = transformHistoryEntries(raw);
		this.loading = false;
		this.error = null;
	}

	applyTagListResponse(raw: TagListResponseRaw) {
		this.tagList = transformTagList(raw);
		this.loading = false;
		this.error = null;
	}

	setLoading(isLoading: boolean) {
		this.loading = isLoading;
	}

	setError(message: string) {
		this.error = message;
		this.loading = false;
	}

	get sortedTagList() {
		return [...this.tagList]
			.filter((m) => m.currentTag !== null)
			.sort((a, b) => (a.currentTag ?? 0) - (b.currentTag ?? 0));
	}

	get recentHistory() {
		return [...this.history].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	}
}

export const tagStore = new TagService();
