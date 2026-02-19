/**
 * Tag store — manages tag history, tag list, and chart data for the PWA.
 *
 * Data-loading strategy:
 * - Tag list: fetched on startup via DataLoader (needed globally for member pickers)
 * - Tag history: fetched on-demand per-page via fetchTagHistory()
 *
 * Pattern: NATS request-reply (no push subscriptions needed — the Discord bot
 * consumes tag history events; the PWA only reads on-demand).
 */

import { nats } from './nats.svelte';

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

// ---- Outbound request payloads ----
interface TagHistoryRequestPayload {
	guild_id: string;
	member_id?: string;
	limit?: number;
}

interface TagListRequestPayload {
	guild_id: string;
	club_uuid?: string;
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
		return this.history.filter((h) => h.newMemberId === this.selectedMemberId);
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

	/**
	 * Fetch tag history for a member (or guild-wide if memberId omitted).
	 * Called on-demand from the tags page, not on startup.
	 */
	async fetchTagHistory(guildId: string, memberId?: string, limit = 100): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const payload: TagHistoryRequestPayload = {
				guild_id: guildId,
				...(memberId ? { member_id: memberId } : {}),
				limit
			};
			const response = await nats.request<TagHistoryRequestPayload, TagHistoryResponseRaw>(
				`leaderboard.tag.history.requested.v1.${guildId}`,
				payload,
				{ timeout: 5000 }
			);
			if (response) {
				this.applyHistoryResponse(response);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to load tag history';
			this.setError(msg);
		}
	}

	/**
	 * Re-fetch the tag list on-demand (e.g. after reconnect or if startup load failed).
	 */
	async fetchTagList(guildId: string, clubUuid?: string): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const payload: TagListRequestPayload = {
				guild_id: guildId,
				...(clubUuid ? { club_uuid: clubUuid } : {})
			};

			const response = await nats.request<TagListRequestPayload, TagListResponseRaw>(
				`leaderboard.tag.list.requested.v1.${clubUuid || guildId}`,
				payload,
				{ timeout: 5000 }
			);
			if (response) {
				this.applyTagListResponse(response);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to load tag list';
			this.setError(msg);
		}
	}

	get sortedTagList() {
		return [...this.tagList]
			.filter((m) => m.currentTag !== null)
			.sort((a, b) => (a.currentTag ?? 0) - (b.currentTag ?? 0));
	}

	get recentHistory() {
		return [...this.history].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
	}
}

export const tagStore = new TagService();
