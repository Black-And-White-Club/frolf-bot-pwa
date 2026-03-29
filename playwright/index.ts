import { beforeMount } from '@playwright/experimental-ct-svelte/hooks';
import { auth, type AuthUser } from '$lib/stores/auth.svelte';
import { isMobile } from '$lib/stores/theme';
import { roundService, type Round } from '$lib/stores/round.svelte';
import { tagStore } from '$lib/stores/tags.svelte';

/**
 * HooksConfig is passed from test code (Node) to the beforeMount hook (browser)
 * via JSON serialisation. Keep all values JSON-serialisable.
 */
export type HooksConfig = {
	/** Set auth.user + auth.status before mount. Pass null to keep unauthenticated. */
	authUser?: Partial<AuthUser> | null;
	authStatus?: 'authenticated' | 'idle';
	/** Override the isMobile store value */
	isMobile?: boolean;
	/** Pre-populate roundService with rounds */
	rounds?: Round[];
	/** Tag store state to set up before mount */
	tagSetup?: {
		selectedMember?: string | null;
		guildId?: string;
		historyLoading?: boolean;
		historyCache?: Array<{
			guildId: string;
			memberId: string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			history: any;
		}>;
		/** Replace fetchTagHistory with a no-op stub */
		mockFetchTagHistory?: boolean;
	};
};

type TagSetup = NonNullable<HooksConfig['tagSetup']>;

function applyTagSetup(ts: TagSetup): void {
	if (ts.historyLoading !== undefined) {
		tagStore.historyLoading = ts.historyLoading;
	}
	if (ts.historyCache) {
		for (const { guildId, memberId, history } of ts.historyCache) {
			tagStore.applyMemberHistoryResponse(guildId, memberId, history);
		}
	}
	if (ts.selectedMember !== undefined) {
		tagStore.selectMember(ts.selectedMember, ts.guildId ?? null);
	}
	if (ts.mockFetchTagHistory) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(tagStore as any).fetchTagHistory = async () => undefined;
	}
}

beforeMount<HooksConfig>(async ({ hooksConfig }) => {
	// Reset all relevant stores to a clean baseline before every mount
	auth.user = null;
	(auth as { status: string }).status = 'idle';
	isMobile.set(false);
	roundService.clear();
	tagStore.selectMember(null);
	tagStore.historyLoading = false;

	if (!hooksConfig) return;

	if (hooksConfig.authUser !== undefined) {
		auth.user = hooksConfig.authUser as AuthUser;
		(auth as { status: string }).status = hooksConfig.authStatus ?? 'authenticated';
	}
	if (hooksConfig.isMobile !== undefined) {
		isMobile.set(hooksConfig.isMobile);
	}
	if (hooksConfig.rounds) {
		roundService.setRounds(hooksConfig.rounds);
	}
	if (hooksConfig.tagSetup) {
		applyTagSetup(hooksConfig.tagSetup);
	}
});
