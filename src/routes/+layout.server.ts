import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/public';
import type { AuthUser } from '$lib/stores/auth.svelte';

// Synthetic mock credentials for Lighthouse / local testing (mock=true mode).
// Matches the mock user set up by init.svelte.ts startMockMode().
const MOCK_USER: AuthUser = {
	id: 'user-1',
	uuid: 'user-uuid-1',
	activeClubUuid: 'guild-123',
	activeClubEntitlements: {
		features: {
			betting: {
				key: 'betting',
				state: 'enabled',
				source: 'subscription'
			}
		}
	},
	guildId: 'guild-123',
	role: 'admin',
	clubs: [
		{
			club_uuid: 'guild-123',
			role: 'admin',
			display_name: 'Mock User',
			avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
		}
	],
	linkedProviders: []
};

export const load: LayoutServerLoad = ({ locals, url }) => {
	// When mock mode is enabled (Lighthouse / local dev), provide mock auth data so that
	// SSR renders the authenticated view. The client's hydrateFromServer() call picks this
	// up synchronously—before first paint—eliminating the unauthenticated→authenticated
	// layout shift (CLS ~0.26) that would otherwise occur after requestIdleCallback fires.
	const allowMock = env.PUBLIC_ALLOW_MOCK_PROD === 'true';
	if (allowMock && !locals.user && url.searchParams.get('mock') === 'true') {
		return { user: MOCK_USER, ticket: 'mock' };
	}

	return { user: locals.user ?? null, ticket: locals.ticket ?? null };
};
