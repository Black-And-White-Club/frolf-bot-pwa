import type { AuthUser } from '$lib/stores/auth.svelte';

export type RequestIdentity = {
	requestSubjectId: string;
	guildId: string | null;
	clubUuid?: string;
};

type IdentityUser = Pick<AuthUser, 'activeClubUuid' | 'guildId'>;

function trimIdentityValue(value: string | null | undefined): string {
	return value?.trim() ?? '';
}

function buildRequestIdentity(
	requestSubjectId: string,
	guildId: string,
	clubUuid: string
): RequestIdentity {
	const normalizedGuildId = guildId || null;

	if (clubUuid === '') {
		return { requestSubjectId, guildId: normalizedGuildId };
	}

	return {
		requestSubjectId,
		guildId: normalizedGuildId,
		clubUuid
	};
}

export function resolveRequestIdentity(
	user: IdentityUser | null | undefined
): RequestIdentity | null {
	const clubUuid = trimIdentityValue(user?.activeClubUuid);
	const guildId = trimIdentityValue(user?.guildId);
	const requestSubjectId = clubUuid || guildId;

	if (!requestSubjectId) {
		return null;
	}

	return buildRequestIdentity(requestSubjectId, guildId, clubUuid);
}
