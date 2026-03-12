import { auth } from './auth.svelte';
import { nats } from './nats.svelte';
import { tagStore } from './tags.svelte';
import { resolveRequestIdentity } from '$lib/utils/requestIdentity';

export type ChallengeStatus =
	| 'open'
	| 'accepted'
	| 'declined'
	| 'withdrawn'
	| 'expired'
	| 'completed'
	| 'hidden';

export type ChallengeTagSnapshot = {
	challenger: number | null;
	defender: number | null;
};

export type ChallengeRoundLink = {
	roundId: string;
	linkedAt: string;
	unlinkedAt: string | null;
	linkedByUserUuid: string | null;
	unlinkedByUserUuid: string | null;
	isActive: boolean;
};

export type ChallengeMessageBinding = {
	guildId: string;
	channelId: string;
	messageId: string;
};

export type ChallengeSummary = {
	id: string;
	clubUuid: string;
	discordGuildId: string | null;
	status: ChallengeStatus;
	challengerUserUuid: string;
	defenderUserUuid: string;
	challengerExternalId: string | null;
	defenderExternalId: string | null;
	originalTags: ChallengeTagSnapshot;
	currentTags: ChallengeTagSnapshot;
	openedAt: string;
	openExpiresAt: string | null;
	acceptedAt: string | null;
	acceptedExpiresAt: string | null;
	linkedRound: ChallengeRoundLink | null;
};

export type ChallengeDetail = ChallengeSummary & {
	completedAt: string | null;
	hiddenAt: string | null;
	hiddenByUserUuid: string | null;
	messageBinding: ChallengeMessageBinding | null;
};

type ChallengeTagSnapshotRaw = {
	challenger?: number | null;
	defender?: number | null;
};

type ChallengeRoundLinkRaw = {
	round_id: string;
	linked_at: string;
	unlinked_at?: string | null;
	linked_by_user_uuid?: string | null;
	unlinked_by_user_uuid?: string | null;
	is_active: boolean;
};

type ChallengeMessageBindingRaw = {
	guild_id: string;
	channel_id: string;
	message_id: string;
};

type ChallengeSummaryRaw = {
	id: string;
	club_uuid: string;
	discord_guild_id?: string | null;
	status: ChallengeStatus;
	challenger_user_uuid: string;
	defender_user_uuid: string;
	challenger_external_id?: string | null;
	defender_external_id?: string | null;
	original_tags: ChallengeTagSnapshotRaw;
	current_tags: ChallengeTagSnapshotRaw;
	opened_at: string;
	open_expires_at?: string | null;
	accepted_at?: string | null;
	accepted_expires_at?: string | null;
	linked_round?: ChallengeRoundLinkRaw | null;
};

type ChallengeDetailRaw = ChallengeSummaryRaw & {
	completed_at?: string | null;
	hidden_at?: string | null;
	hidden_by_user_uuid?: string | null;
	message_binding?: ChallengeMessageBindingRaw | null;
};

type ChallengeListResponseRaw = {
	challenges: ChallengeSummaryRaw[];
};

type ChallengeDetailResponseRaw = {
	challenge?: ChallengeDetailRaw | null;
};

type ChallengeActionOptions = {
	successMessage?: string;
};

type ChallengeParticipantIdentity = {
	userUuid: string | null;
	externalId: string | null;
};

type ChallengeOpenPayload = {
	club_uuid?: string;
	guild_id?: string;
	actor_user_uuid?: string;
	actor_external_id?: string;
	target_user_uuid?: string;
	target_external_id?: string;
};

type ChallengeResponsePayload = {
	club_uuid?: string;
	guild_id?: string;
	actor_user_uuid?: string;
	actor_external_id?: string;
	challenge_id: string;
	response: 'accept' | 'decline';
};

type ChallengeActionPayload = {
	club_uuid?: string;
	guild_id?: string;
	actor_user_uuid?: string;
	actor_external_id?: string;
	challenge_id: string;
};

type ChallengeRoundLinkPayload = ChallengeActionPayload & {
	round_id: string;
};

type ChallengeEligibility = {
	allowed: boolean;
	reason: string | null;
};

const BOARD_STATUSES: readonly ChallengeStatus[] = ['open', 'accepted'];

const CHALLENGE_LIST_SUBJECT = 'club.challenge.list.request.v1';
const CHALLENGE_DETAIL_SUBJECT = 'club.challenge.detail.request.v1';
const CHALLENGE_OPEN_SUBJECT = 'club.challenge.open.requested.v1';
const CHALLENGE_RESPOND_SUBJECT = 'club.challenge.respond.requested.v1';
const CHALLENGE_WITHDRAW_SUBJECT = 'club.challenge.withdraw.requested.v1';
const CHALLENGE_HIDE_SUBJECT = 'club.challenge.hide.requested.v1';
const CHALLENGE_LINK_ROUND_SUBJECT = 'club.challenge.round.link.requested.v1';
const CHALLENGE_UNLINK_ROUND_SUBJECT = 'club.challenge.round.unlink.requested.v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeIdentityValue(value: string | null | undefined): string | null {
	const normalized = value?.trim() ?? '';
	return normalized || null;
}

function isUuidLike(value: string | null | undefined): boolean {
	return value != null && UUID_PATTERN.test(value);
}

function normalizeParticipantIdentity(
	identity: string | Partial<ChallengeParticipantIdentity> | null | undefined
): ChallengeParticipantIdentity {
	if (typeof identity === 'string') {
		const normalized = normalizeIdentityValue(identity);
		if (!normalized) {
			return { userUuid: null, externalId: null };
		}

		return isUuidLike(normalized)
			? { userUuid: normalized, externalId: null }
			: { userUuid: null, externalId: normalized };
	}

	return {
		userUuid: normalizeIdentityValue(identity?.userUuid),
		externalId: normalizeIdentityValue(identity?.externalId)
	};
}

function hasParticipantIdentity(identity: ChallengeParticipantIdentity): boolean {
	return identity.userUuid !== null || identity.externalId !== null;
}

function participantIdentitiesMatch(
	a: ChallengeParticipantIdentity,
	b: ChallengeParticipantIdentity
): boolean {
	return (
		(a.userUuid !== null && a.userUuid === b.userUuid) ||
		(a.externalId !== null && a.externalId === b.externalId)
	);
}

function normalizeTagSnapshot(
	snapshot: ChallengeTagSnapshotRaw | null | undefined
): ChallengeTagSnapshot {
	return {
		challenger: typeof snapshot?.challenger === 'number' ? snapshot.challenger : null,
		defender: typeof snapshot?.defender === 'number' ? snapshot.defender : null
	};
}

function transformChallengeRoundLink(
	raw: ChallengeRoundLinkRaw | null | undefined
): ChallengeRoundLink | null {
	if (!raw?.round_id) {
		return null;
	}

	return {
		roundId: raw.round_id,
		linkedAt: raw.linked_at,
		unlinkedAt: raw.unlinked_at ?? null,
		linkedByUserUuid: raw.linked_by_user_uuid ?? null,
		unlinkedByUserUuid: raw.unlinked_by_user_uuid ?? null,
		isActive: raw.is_active === true
	};
}

function transformChallengeSummary(raw: ChallengeSummaryRaw): ChallengeSummary {
	return {
		id: raw.id,
		clubUuid: raw.club_uuid,
		discordGuildId: raw.discord_guild_id ?? null,
		status: raw.status,
		challengerUserUuid: raw.challenger_user_uuid,
		defenderUserUuid: raw.defender_user_uuid,
		challengerExternalId: raw.challenger_external_id ?? null,
		defenderExternalId: raw.defender_external_id ?? null,
		originalTags: normalizeTagSnapshot(raw.original_tags),
		currentTags: normalizeTagSnapshot(raw.current_tags),
		openedAt: raw.opened_at,
		openExpiresAt: raw.open_expires_at ?? null,
		acceptedAt: raw.accepted_at ?? null,
		acceptedExpiresAt: raw.accepted_expires_at ?? null,
		linkedRound: transformChallengeRoundLink(raw.linked_round)
	};
}

function transformChallengeDetail(raw: ChallengeDetailRaw): ChallengeDetail {
	return {
		...transformChallengeSummary(raw),
		completedAt: raw.completed_at ?? null,
		hiddenAt: raw.hidden_at ?? null,
		hiddenByUserUuid: raw.hidden_by_user_uuid ?? null,
		messageBinding: raw.message_binding
			? {
					guildId: raw.message_binding.guild_id,
					channelId: raw.message_binding.channel_id,
					messageId: raw.message_binding.message_id
				}
			: null
	};
}

function isBoardVisibleStatus(status: ChallengeStatus): boolean {
	return status === 'open' || status === 'accepted';
}

class ChallengeService {
	board = $state<ChallengeSummary[]>([]);
	isLoading = $state(false);
	errorMessage = $state<string | null>(null);
	successMessage = $state<string | null>(null);
	detail = $state<ChallengeDetail | null>(null);
	detailLoading = $state(false);
	detailError = $state<string | null>(null);
	currentDetailId = $state<string | null>(null);

	openChallenges = $derived(this.board.filter((challenge) => challenge.status === 'open'));
	acceptedChallenges = $derived(this.board.filter((challenge) => challenge.status === 'accepted'));
	hasChallenges = $derived(this.board.length > 0);

	clearMessages(): void {
		this.errorMessage = null;
		this.successMessage = null;
	}

	reset(): void {
		this.board = [];
		this.isLoading = false;
		this.clearMessages();
		this.clearDetail();
	}

	clearDetail(challengeId?: string): void {
		const normalizedChallengeId = normalizeIdentityValue(challengeId);
		if (normalizedChallengeId && normalizedChallengeId !== this.currentDetailId) {
			return;
		}

		this.detail = null;
		this.detailLoading = false;
		this.detailError = null;
		this.currentDetailId = null;
	}

	async loadBoard(statuses: readonly ChallengeStatus[] = BOARD_STATUSES): Promise<void> {
		const identity = resolveRequestIdentity(auth.user);
		if (!identity || !nats.isConnected) {
			return;
		}

		this.isLoading = true;

		try {
			const response = await nats.request<
				{ guild_id?: string; club_uuid?: string; statuses: readonly ChallengeStatus[] },
				ChallengeListResponseRaw
			>(`${CHALLENGE_LIST_SUBJECT}.${identity.requestSubjectId}`, {
				guild_id: identity.guildId ?? undefined,
				club_uuid: identity.clubUuid,
				statuses
			});

			this.board = (response?.challenges ?? []).map(transformChallengeSummary);
			this.errorMessage = null;
		} catch (error) {
			this.errorMessage =
				error instanceof Error ? error.message : 'Failed to load challenge board.';
		} finally {
			this.isLoading = false;
		}
	}

	async loadDetail(challengeId: string): Promise<ChallengeDetail | null> {
		const normalizedChallengeId = this.prepareDetailId(challengeId);
		if (!normalizedChallengeId) {
			return null;
		}

		const identity = this.prepareDetailRequest(normalizedChallengeId);
		if (!identity) {
			return null;
		}

		this.beginDetailLoad();

		try {
			const response = await this.requestDetail(identity, normalizedChallengeId);
			return this.consumeDetailResponse(response);
		} catch (error) {
			return this.handleDetailLoadError(error);
		} finally {
			this.detailLoading = false;
		}
	}

	private prepareDetailId(challengeId: string): string | null {
		const normalizedChallengeId = normalizeIdentityValue(challengeId);
		if (normalizedChallengeId) {
			this.currentDetailId = normalizedChallengeId;
			return normalizedChallengeId;
		}

		this.detail = null;
		this.currentDetailId = null;
		this.detailError = 'Challenge identity is missing.';
		return null;
	}

	private prepareDetailRequest(
		challengeId: string
	): ReturnType<typeof resolveRequestIdentity> | null {
		const identity = resolveRequestIdentity(auth.user);
		if (identity && nats.isConnected) {
			return identity;
		}

		this.currentDetailId = challengeId;
		this.detail = null;
		this.detailLoading = false;
		this.detailError = 'Live connection unavailable. Refresh and try again.';
		return null;
	}

	private beginDetailLoad(): void {
		this.detailLoading = true;
		this.detailError = null;
	}

	private requestDetail(
		identity: NonNullable<ReturnType<typeof resolveRequestIdentity>>,
		challengeId: string
	): Promise<ChallengeDetailResponseRaw> {
		return nats.request<
			{ guild_id?: string; club_uuid?: string; challenge_id: string },
			ChallengeDetailResponseRaw
		>(`${CHALLENGE_DETAIL_SUBJECT}.${identity.requestSubjectId}`, {
			guild_id: identity.guildId ?? undefined,
			club_uuid: identity.clubUuid,
			challenge_id: challengeId
		});
	}

	private consumeDetailResponse(response: ChallengeDetailResponseRaw): ChallengeDetail | null {
		if (!response?.challenge || typeof response.challenge !== 'object') {
			this.detail = null;
			this.detailError = 'Challenge not found.';
			return null;
		}

		const detail = transformChallengeDetail(response.challenge);
		this.detail = detail;
		this.detailError = null;
		this.syncBoardWithDetail(detail);
		return detail;
	}

	private syncBoardWithDetail(detail: ChallengeDetail): void {
		if (isBoardVisibleStatus(detail.status)) {
			this.upsertChallenge(detail);
			return;
		}

		this.board = this.board.filter((entry) => entry.id !== detail.id);
	}

	private handleDetailLoadError(error: unknown): null {
		this.detail = null;
		this.detailError = error instanceof Error ? error.message : 'Failed to load challenge detail.';
		return null;
	}

	getPairChallenge(
		targetParticipant: string | Partial<ChallengeParticipantIdentity>
	): ChallengeSummary | null {
		const currentIdentity = this.getCurrentUserIdentity();
		const targetIdentity = normalizeParticipantIdentity(targetParticipant);
		if (!hasParticipantIdentity(currentIdentity) || !hasParticipantIdentity(targetIdentity)) {
			return null;
		}

		return (
			this.board.find((challenge) => {
				return (
					this.challengeIncludesParticipant(challenge, currentIdentity) &&
					this.challengeIncludesParticipant(challenge, targetIdentity)
				);
			}) ?? null
		);
	}

	getChallengesForExternalId(externalId: string): ChallengeSummary[] {
		const participantIdentity = normalizeParticipantIdentity(externalId);
		if (!hasParticipantIdentity(participantIdentity)) {
			return [];
		}

		return this.board.filter((challenge) =>
			this.challengeIncludesParticipant(challenge, participantIdentity)
		);
	}

	getChallengeById(challengeId: string): ChallengeSummary | ChallengeDetail | null {
		const normalizedChallengeId = normalizeIdentityValue(challengeId);
		if (!normalizedChallengeId) {
			return null;
		}

		if (this.detail?.id === normalizedChallengeId) {
			return this.detail;
		}

		return this.board.find((challenge) => challenge.id === normalizedChallengeId) ?? null;
	}

	private getUserEligibilityReason(
		targetParticipant: string | Partial<ChallengeParticipantIdentity>
	): string | null {
		if (!auth.isAuthenticated || !auth.user) {
			return 'Sign in to challenge players.';
		}

		if (auth.activeRole === 'viewer') {
			return 'Player role is required to open a challenge.';
		}

		if (!resolveRequestIdentity(auth.user)) {
			return 'Club identity is missing. Refresh and try again.';
		}

		if (!hasParticipantIdentity(this.getCurrentUserIdentity())) {
			return 'Your player identity is missing. Refresh and try again.';
		}

		const targetIdentity = normalizeParticipantIdentity(targetParticipant);
		if (!hasParticipantIdentity(targetIdentity)) {
			return 'That player cannot be challenged right now.';
		}

		if (participantIdentitiesMatch(targetIdentity, this.getCurrentUserIdentity())) {
			return 'You cannot challenge yourself.';
		}

		return null;
	}

	private getActiveChallengeEligibilityReason(
		targetParticipant: string | Partial<ChallengeParticipantIdentity>
	): string | null {
		if (this.getPairChallenge(targetParticipant)) {
			return 'You already have an active challenge with this player.';
		}

		if (
			this.board.some(
				(challenge) => challenge.status === 'open' && this.isCurrentUserChallenger(challenge)
			)
		) {
			return 'You already have an open outgoing challenge.';
		}

		if (
			this.board.some(
				(challenge) => challenge.status === 'accepted' && this.isCurrentUserParticipant(challenge)
			)
		) {
			return 'You already have an accepted challenge.';
		}

		return null;
	}

	private getCurrentUserTag(): number | null {
		const currentUserIdentity = this.getCurrentUserIdentity();
		const currentTag = tagStore.tagList.find((member) =>
			this.memberMatchesParticipantIdentity(member.memberId, currentUserIdentity)
		)?.currentTag;
		return typeof currentTag === 'number' ? currentTag : null;
	}

	private getTagEligibilityReason(targetCurrentTag: number | null | undefined): string | null {
		const currentUserTag = this.getCurrentUserTag();
		if (currentUserTag === null) {
			return 'You need an active tag before you can challenge someone.';
		}

		if (typeof targetCurrentTag !== 'number') {
			return 'That player does not currently hold a tag.';
		}

		if (currentUserTag <= targetCurrentTag) {
			return 'You can only challenge a better tag than your own.';
		}

		return null;
	}

	getChallengeEligibility(
		targetParticipant: string | Partial<ChallengeParticipantIdentity>,
		targetCurrentTag: number | null | undefined
	): ChallengeEligibility {
		const reason =
			this.getUserEligibilityReason(targetParticipant) ??
			this.getActiveChallengeEligibilityReason(targetParticipant) ??
			this.getTagEligibilityReason(targetCurrentTag);

		if (reason) {
			return { allowed: false, reason };
		}

		return { allowed: true, reason: null };
	}

	isCurrentUserParticipant(challenge: ChallengeSummary | ChallengeDetail): boolean {
		return (
			(auth.user?.uuid != null &&
				(challenge.challengerUserUuid === auth.user.uuid ||
					challenge.defenderUserUuid === auth.user.uuid)) ||
			(auth.user?.id != null &&
				(challenge.challengerExternalId === auth.user.id ||
					challenge.defenderExternalId === auth.user.id))
		);
	}

	isCurrentUserChallenger(challenge: ChallengeSummary | ChallengeDetail): boolean {
		return (
			(auth.user?.uuid != null && challenge.challengerUserUuid === auth.user.uuid) ||
			(auth.user?.id != null && challenge.challengerExternalId === auth.user.id)
		);
	}

	isCurrentUserDefender(challenge: ChallengeSummary | ChallengeDetail): boolean {
		return (
			(auth.user?.uuid != null && challenge.defenderUserUuid === auth.user.uuid) ||
			(auth.user?.id != null && challenge.defenderExternalId === auth.user.id)
		);
	}

	canManageChallenge(challenge: ChallengeSummary | ChallengeDetail): boolean {
		if (auth.activeRole === 'admin' || auth.activeRole === 'editor') {
			return true;
		}

		return this.isCurrentUserParticipant(challenge);
	}

	handleFact(raw: { challenge?: unknown } | null | undefined): void {
		if (!raw?.challenge || typeof raw.challenge !== 'object') {
			return;
		}

		const challenge = transformChallengeDetail(raw.challenge as ChallengeDetailRaw);
		if (this.detail?.id === challenge.id || this.currentDetailId === challenge.id) {
			this.detail = challenge;
			this.detailError = null;
		}

		if (!isBoardVisibleStatus(challenge.status)) {
			this.board = this.board.filter((entry) => entry.id !== challenge.id);
			return;
		}

		this.upsertChallenge(challenge);
	}

	async openChallenge(
		targetParticipant: string | Partial<ChallengeParticipantIdentity>,
		options: ChallengeActionOptions = {}
	): Promise<boolean> {
		const payload = this.buildChallengeOpenPayload(targetParticipant);
		if (!payload) {
			return false;
		}

		return this.publishAction(CHALLENGE_OPEN_SUBJECT, payload, {
			successMessage: options.successMessage ?? 'Challenge requested. It will appear shortly.'
		});
	}

	async respondToChallenge(
		challengeId: string,
		response: 'accept' | 'decline',
		options: ChallengeActionOptions = {}
	): Promise<boolean> {
		const payload = this.buildChallengeResponsePayload(challengeId, response);
		if (!payload) {
			return false;
		}

		return this.publishAction(CHALLENGE_RESPOND_SUBJECT, payload, {
			successMessage:
				options.successMessage ??
				(response === 'accept'
					? 'Challenge accepted. It will update shortly.'
					: 'Challenge declined. It will update shortly.')
		});
	}

	async withdrawChallenge(
		challengeId: string,
		options: ChallengeActionOptions = {}
	): Promise<boolean> {
		const payload = this.buildChallengeActionPayload(challengeId);
		if (!payload) {
			return false;
		}

		return this.publishAction(CHALLENGE_WITHDRAW_SUBJECT, payload, {
			successMessage: options.successMessage ?? 'Challenge withdrawn. It will update shortly.'
		});
	}

	async hideChallenge(challengeId: string, options: ChallengeActionOptions = {}): Promise<boolean> {
		const payload = this.buildChallengeActionPayload(challengeId);
		if (!payload) {
			return false;
		}

		return this.publishAction(CHALLENGE_HIDE_SUBJECT, payload, {
			successMessage: options.successMessage ?? 'Challenge hidden. It will update shortly.'
		});
	}

	async linkRound(
		challengeId: string,
		roundId: string,
		options: ChallengeActionOptions = {}
	): Promise<boolean> {
		const payload = this.buildChallengeRoundLinkPayload(challengeId, roundId);
		if (!payload) {
			return false;
		}

		return this.publishAction(CHALLENGE_LINK_ROUND_SUBJECT, payload, {
			successMessage: options.successMessage ?? 'Round link requested. It will update shortly.'
		});
	}

	async unlinkRound(challengeId: string, options: ChallengeActionOptions = {}): Promise<boolean> {
		const payload = this.buildChallengeActionPayload(challengeId);
		if (!payload) {
			return false;
		}

		return this.publishAction(CHALLENGE_UNLINK_ROUND_SUBJECT, payload, {
			successMessage:
				options.successMessage ?? 'Round unlinked. The challenge can be rescheduled now.'
		});
	}

	private upsertChallenge(challenge: ChallengeSummary): void {
		const index = this.board.findIndex((entry) => entry.id === challenge.id);
		if (index === -1) {
			this.board = [...this.board, challenge].sort(sortChallengesForBoard);
			return;
		}

		this.board = this.board
			.map((entry, entryIndex) => (entryIndex === index ? challenge : entry))
			.sort(sortChallengesForBoard);
	}

	private buildChallengeOpenPayload(
		targetParticipant: string | Partial<ChallengeParticipantIdentity>
	): ChallengeOpenPayload | null {
		const identity = resolveRequestIdentity(auth.user);
		if (!identity) {
			this.errorMessage = 'Club identity is missing. Refresh and try again.';
			return null;
		}

		const actorIdentity = this.getCurrentUserIdentity();
		if (!hasParticipantIdentity(actorIdentity)) {
			this.errorMessage = 'Your player identity is missing. Refresh and try again.';
			return null;
		}

		const targetIdentity = normalizeParticipantIdentity(targetParticipant);
		if (!hasParticipantIdentity(targetIdentity)) {
			this.errorMessage = 'That player cannot be challenged right now.';
			return null;
		}

		return {
			guild_id: identity.guildId ?? undefined,
			club_uuid: identity.clubUuid,
			actor_user_uuid: actorIdentity.userUuid ?? undefined,
			actor_external_id: actorIdentity.externalId ?? undefined,
			target_user_uuid: targetIdentity.userUuid ?? undefined,
			target_external_id: targetIdentity.externalId ?? undefined
		};
	}

	private getCurrentUserIdentity(): ChallengeParticipantIdentity {
		return {
			userUuid: normalizeIdentityValue(auth.user?.uuid),
			externalId: normalizeIdentityValue(auth.user?.id)
		};
	}

	private memberMatchesParticipantIdentity(
		memberId: string,
		participantIdentity: ChallengeParticipantIdentity
	): boolean {
		const normalizedMemberId = normalizeIdentityValue(memberId);
		if (!normalizedMemberId) {
			return false;
		}

		return (
			(participantIdentity.userUuid !== null &&
				normalizedMemberId === participantIdentity.userUuid) ||
			(participantIdentity.externalId !== null &&
				normalizedMemberId === participantIdentity.externalId)
		);
	}

	private challengeIncludesParticipant(
		challenge: ChallengeSummary | ChallengeDetail,
		participantIdentity: ChallengeParticipantIdentity
	): boolean {
		if (!hasParticipantIdentity(participantIdentity)) {
			return false;
		}

		return (
			this.memberMatchesParticipantIdentity(challenge.challengerUserUuid, participantIdentity) ||
			this.memberMatchesParticipantIdentity(challenge.defenderUserUuid, participantIdentity) ||
			this.memberMatchesParticipantIdentity(
				challenge.challengerExternalId ?? '',
				participantIdentity
			) ||
			this.memberMatchesParticipantIdentity(challenge.defenderExternalId ?? '', participantIdentity)
		);
	}

	private buildChallengeResponsePayload(
		challengeId: string,
		response: 'accept' | 'decline'
	): ChallengeResponsePayload | null {
		const base = this.buildChallengeActionPayload(challengeId);
		if (!base) {
			return null;
		}

		return {
			...base,
			response
		};
	}

	private buildChallengeRoundLinkPayload(
		challengeId: string,
		roundId: string
	): ChallengeRoundLinkPayload | null {
		const base = this.buildChallengeActionPayload(challengeId);
		if (!base) {
			return null;
		}

		const normalizedRoundId = roundId.trim();
		if (!normalizedRoundId) {
			this.errorMessage = 'Choose a round to link first.';
			return null;
		}

		return {
			...base,
			round_id: normalizedRoundId
		};
	}

	private buildChallengeActionPayload(challengeId: string): ChallengeActionPayload | null {
		const identity = resolveRequestIdentity(auth.user);
		if (!identity) {
			this.errorMessage = 'Club identity is missing. Refresh and try again.';
			return null;
		}

		const actorIdentity = this.getCurrentUserIdentity();
		if (!hasParticipantIdentity(actorIdentity)) {
			this.errorMessage = 'Your player identity is missing. Refresh and try again.';
			return null;
		}

		const normalizedChallengeId = challengeId.trim();
		if (!normalizedChallengeId) {
			this.errorMessage = 'Challenge identity is missing.';
			return null;
		}

		return {
			guild_id: identity.guildId ?? undefined,
			club_uuid: identity.clubUuid,
			actor_user_uuid: actorIdentity.userUuid ?? undefined,
			actor_external_id: actorIdentity.externalId ?? undefined,
			challenge_id: normalizedChallengeId
		};
	}

	private async publishAction<TPayload>(
		subject: string,
		payload: TPayload,
		options: ChallengeActionOptions
	): Promise<boolean> {
		if (!nats.isConnected) {
			this.errorMessage = 'Live connection unavailable. Refresh and try again.';
			return false;
		}

		this.clearMessages();

		try {
			nats.publish(subject, payload);
			this.successMessage = options.successMessage ?? 'Challenge updated.';
			return true;
		} catch (error) {
			this.errorMessage = error instanceof Error ? error.message : 'Failed to update challenge.';
			return false;
		}
	}
}

function sortChallengesForBoard(a: ChallengeSummary, b: ChallengeSummary): number {
	if (a.status !== b.status) {
		return a.status === 'open' ? -1 : 1;
	}

	const aTime = Date.parse(a.acceptedAt ?? a.openedAt);
	const bTime = Date.parse(b.acceptedAt ?? b.openedAt);
	return bTime - aTime;
}

export const challengeStore = new ChallengeService();
