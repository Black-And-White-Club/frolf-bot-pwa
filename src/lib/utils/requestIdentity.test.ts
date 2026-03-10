import { describe, expect, it } from 'vitest';
import type { AuthUser } from '$lib/stores/auth.svelte';

import { resolveRequestIdentity } from './requestIdentity';

describe('resolveRequestIdentity', () => {
	it('returns requestSubjectId from club UUID and guildId from Discord guild ID when both exist', () => {
		const user = {
			activeClubUuid: 'club-123',
			guildId: 'guild-456'
		} satisfies Pick<AuthUser, 'activeClubUuid' | 'guildId'>;

		expect(resolveRequestIdentity(user)).toEqual({
			requestSubjectId: 'club-123',
			guildId: 'guild-456',
			clubUuid: 'club-123'
		});
	});

	it('falls back to guildId for requestSubjectId when no club UUID exists', () => {
		const user = {
			activeClubUuid: '',
			guildId: 'guild-only'
		} satisfies Pick<AuthUser, 'activeClubUuid' | 'guildId'>;

		expect(resolveRequestIdentity(user)).toEqual({
			requestSubjectId: 'guild-only',
			guildId: 'guild-only'
		});
	});

	it('keeps guildId null when only a club UUID exists', () => {
		const user = {
			activeClubUuid: 'club-only',
			guildId: ''
		} satisfies Pick<AuthUser, 'activeClubUuid' | 'guildId'>;

		expect(resolveRequestIdentity(user)).toEqual({
			requestSubjectId: 'club-only',
			guildId: null,
			clubUuid: 'club-only'
		});
	});

	it('returns null when neither identity is present', () => {
		expect(resolveRequestIdentity(null)).toBeNull();

		const user = {
			activeClubUuid: '',
			guildId: ''
		} satisfies Pick<AuthUser, 'activeClubUuid' | 'guildId'>;
		expect(resolveRequestIdentity(user)).toBeNull();
	});
});
