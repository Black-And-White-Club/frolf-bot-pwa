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
import type { UserProfileRaw } from './userProfiles.svelte';
import type { RequestIdentity } from '$lib/utils/requestIdentity';

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
	profiles?: Record<string, UserProfileRaw>;
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
	club_uuid?: string;
	member_id?: string;
	limit?: number;
}

interface TagListRequestPayload {
	guild_id: string;
	club_uuid?: string;
}

type SelectedHistoryContext = {
	requestSubjectId: string;
	guildId: string;
	clubUuid?: string;
	memberId: string;
};

type TagHistoryRequestIdentity =
	| Pick<RequestIdentity, 'requestSubjectId' | 'guildId' | 'clubUuid'>
	| string;

type NormalizedTagHistoryIdentity = {
	requestSubjectId: string;
	guildId: string;
	clubUuid?: string;
};

function normalizeIdentityValue(value: string | null | undefined): string {
	return value?.trim() ?? '';
}

function normalizeTagHistoryIdentity(
	identity: TagHistoryRequestIdentity | null | undefined
): NormalizedTagHistoryIdentity | null {
	if (typeof identity === 'string') {
		const normalized = normalizeIdentityValue(identity);
		if (!normalized) {
			return null;
		}

		return {
			requestSubjectId: normalized,
			guildId: normalized
		};
	}

	const requestSubjectId = normalizeIdentityValue(identity?.requestSubjectId);
	const guildId = normalizeIdentityValue(identity?.guildId) || requestSubjectId;
	const clubUuid = normalizeIdentityValue(identity?.clubUuid);
	if (!requestSubjectId || !guildId) {
		return null;
	}

	const normalizedIdentity: NormalizedTagHistoryIdentity = {
		requestSubjectId,
		guildId
	};

	if (clubUuid) {
		normalizedIdentity.clubUuid = clubUuid;
	}

	return normalizedIdentity;
}

function memberHistoryCacheKey(requestSubjectId: string, memberId: string): string {
	return `${requestSubjectId}::${memberId}`;
}

export class TagService {
	history = $state<TagHistoryEntry[]>([]);
	tagList = $state<TagListMember[]>([]);
	loading = $state(false);
	historyLoading = $state(false);
	error = $state<string | null>(null);
	selectedMemberId = $state<string | null>(null);
	selectedMemberRequestSubjectId = $state<string | null>(null);
	selectedMemberGuildId = $state<string | null>(null);
	selectedMemberClubUuid = $state<string | null>(null);
	historyCache = $state<Record<string, TagHistoryEntry[]>>({});

	selectMember(memberId: null): void;
	selectMember(memberId: string, identity: TagHistoryRequestIdentity | null): void;
	selectMember(memberId: string | null, identity: TagHistoryRequestIdentity | null = null) {
		if (!memberId) {
			this.selectedMemberId = null;
			this.selectedMemberRequestSubjectId = null;
			this.selectedMemberGuildId = null;
			this.selectedMemberClubUuid = null;
			return;
		}

		const normalizedIdentity = normalizeTagHistoryIdentity(identity);
		this.selectedMemberId = memberId;
		this.selectedMemberRequestSubjectId = normalizedIdentity?.requestSubjectId ?? null;
		this.selectedMemberGuildId = normalizedIdentity?.guildId ?? null;
		this.selectedMemberClubUuid = normalizedIdentity?.clubUuid ?? null;
	}

	get memberList() {
		return this.tagList;
	}

	get selectedHistoryContext(): SelectedHistoryContext | null {
		if (
			!this.selectedMemberId ||
			!this.selectedMemberRequestSubjectId ||
			!this.selectedMemberGuildId
		) {
			return null;
		}

		return {
			requestSubjectId: this.selectedMemberRequestSubjectId,
			guildId: this.selectedMemberGuildId,
			...(this.selectedMemberClubUuid ? { clubUuid: this.selectedMemberClubUuid } : {}),
			memberId: this.selectedMemberId
		};
	}

	get selectedMemberHistory(): TagHistoryEntry[] {
		const selected = this.selectedHistoryContext;
		if (!selected) return [];

		const cached =
			this.historyCache[memberHistoryCacheKey(selected.requestSubjectId, selected.memberId)];
		if (!cached) return [];
		return [...cached].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
	}

	applyHistoryResponse(raw: TagHistoryResponseRaw) {
		this.history = transformHistoryEntries(raw);
		this.loading = false;
		this.error = null;
	}

	applyMemberHistoryResponse(
		requestSubjectId: string,
		memberId: string,
		raw: TagHistoryResponseRaw
	) {
		this.historyCache = {
			...this.historyCache,
			[memberHistoryCacheKey(requestSubjectId, memberId)]: transformHistoryEntries(raw)
		};
		this.historyLoading = false;
	}

	applyTagListResponse(raw: TagListResponseRaw) {
		this.tagList = transformTagList(raw);
		this.loading = false;
		this.error = null;
	}

	upsertTagMember({
		memberId,
		currentTag,
		lastActiveAt
	}: {
		memberId: string;
		currentTag: number | null;
		lastActiveAt?: string;
	}) {
		const memberIndex = this.tagList.findIndex((member) => member.memberId === memberId);
		if (memberIndex === -1) {
			this.tagList = [
				...this.tagList,
				{
					memberId,
					currentTag,
					lastActiveAt
				}
			];
			return;
		}

		this.tagList = this.tagList.map((member, index) =>
			index === memberIndex
				? {
						...member,
						currentTag,
						lastActiveAt: lastActiveAt ?? member.lastActiveAt
					}
				: member
		);
	}

	swapTagMembers(memberIdA: string, memberIdB: string) {
		const memberA = this.tagList.find((member) => member.memberId === memberIdA);
		const memberB = this.tagList.find((member) => member.memberId === memberIdB);
		if (!memberA || !memberB) {
			return;
		}

		this.tagList = this.tagList.map((member) => {
			if (member.memberId === memberIdA) {
				return { ...member, currentTag: memberB.currentTag };
			}
			if (member.memberId === memberIdB) {
				return { ...member, currentTag: memberA.currentTag };
			}
			return member;
		});
	}

	setLoading(isLoading: boolean) {
		this.loading = isLoading;
	}

	setError(message: string) {
		this.error = message;
		this.loading = false;
	}

	reset() {
		this.history = [];
		this.tagList = [];
		this.loading = false;
		this.historyLoading = false;
		this.error = null;
		this.selectedMemberId = null;
		this.selectedMemberRequestSubjectId = null;
		this.selectedMemberGuildId = null;
		this.selectedMemberClubUuid = null;
		this.historyCache = {};
	}

	/**
	 * Fetch tag history for a member (or guild-wide if memberId omitted).
	 * Called on-demand from the tags page, not on startup.
	 *
	 * When memberId is provided: uses a per-member historyCache so guild-wide
	 * history is never overwritten, and historyLoading tracks this fetch.
	 * When no memberId: fetches guild-wide into `history`, uses `loading`.
	 */
	async fetchTagHistory(
		identity: TagHistoryRequestIdentity,
		memberId?: string,
		limit = 100
	): Promise<void> {
		const normalizedIdentity = normalizeTagHistoryIdentity(identity);
		if (!normalizedIdentity) {
			this.setError('Failed to load tag history');
			return;
		}

		if (memberId) {
			await this.#fetchMemberHistory(normalizedIdentity, memberId, limit);
		} else {
			await this.#fetchGuildHistory(normalizedIdentity, limit);
		}
	}

	async #fetchMemberHistory(
		identity: NormalizedTagHistoryIdentity,
		memberId: string,
		limit: number
	): Promise<void> {
		const cacheKey = memberHistoryCacheKey(identity.requestSubjectId, memberId);
		if (this.historyCache[cacheKey]) return;

		this.historyLoading = true;
		this.error = null;

		try {
			const payload: TagHistoryRequestPayload = {
				guild_id: identity.guildId,
				...(identity.clubUuid ? { club_uuid: identity.clubUuid } : {}),
				member_id: memberId,
				limit
			};
			const response = await nats.request<TagHistoryRequestPayload, TagHistoryResponseRaw>(
				`leaderboard.tag.history.requested.v1.${identity.requestSubjectId}`,
				payload,
				{ timeout: 5000 }
			);
			if (response) {
				this.applyMemberHistoryResponse(identity.requestSubjectId, memberId, response);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to load tag history';
			this.historyLoading = false;
			this.setError(msg);
		}
	}

	async #fetchGuildHistory(identity: NormalizedTagHistoryIdentity, limit: number): Promise<void> {
		this.loading = true;
		this.error = null;

		try {
			const payload: TagHistoryRequestPayload = {
				guild_id: identity.guildId,
				...(identity.clubUuid ? { club_uuid: identity.clubUuid } : {}),
				limit
			};
			const response = await nats.request<TagHistoryRequestPayload, TagHistoryResponseRaw>(
				`leaderboard.tag.history.requested.v1.${identity.requestSubjectId}`,
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

	get maxTagNumber(): number | null {
		const active = this.tagList.filter((m) => m.currentTag !== null);
		if (active.length === 0) return null;
		return Math.max(...active.map((m) => m.currentTag!));
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
