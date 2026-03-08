// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';

const { initState, mockRegisterServiceWorker, mockShowUpdate, pageState } = vi.hoisted(() => ({
	pageState: {
		data: {
			user: null as {
				id: string;
				uuid: string;
				activeClubUuid: string;
				guildId: string;
				role: 'viewer' | 'player' | 'editor' | 'admin';
				clubs: Array<{ club_uuid: string; role: 'viewer' | 'player' | 'editor' | 'admin' }>;
				linkedProviders: string[];
			} | null,
			ticket: null as string | null
		},
		url: new URL('http://localhost/account') as any
	},
	initState: {
		isLoading: false,
		error: null as string | null,
		needsClub: false,
		initialize: vi.fn(async () => {}),
		teardown: vi.fn(async () => {})
	},
	mockRegisterServiceWorker: vi.fn(async () => {}),
	mockShowUpdate: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$app/state', () => ({
	page: pageState
}));

vi.mock('$lib/stores/init.svelte', () => ({
	appInit: initState
}));

vi.mock('$lib/pwa/registerServiceWorker', () => ({
	registerServiceWorker: mockRegisterServiceWorker
}));

vi.mock('$lib/pwa/updateSnackbarHelper', () => ({
	showUpdate: mockShowUpdate
}));

vi.mock('$lib/components/general/Navbar.svelte', () => ({
	default: () => null
}));

vi.mock('$lib/components/general/LiveAnnouncer.svelte', () => ({
	default: () => null
}));

vi.mock('$lib/components/general/UpdateSnackbar.client.svelte', () => ({
	default: () => null
}));

vi.mock('$lib/components/auth/ClubDiscovery.svelte', () => ({
	default: () => null
}));

vi.mock('$lib/components/pwa/InstallPrompt.svelte', () => ({
	default: () => null
}));

import Layout from '../src/routes/+layout.svelte';
import { auth } from '../src/lib/stores/auth.svelte';

describe('Root layout auth bootstrap', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		auth.token = null;
		auth.user = null;
		auth.status = 'idle';
		auth.error = null;

		pageState.data.user = {
			id: 'user-123',
			uuid: 'uuid-123',
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			role: 'player',
			clubs: [{ club_uuid: 'club-123', role: 'player' }],
			linkedProviders: []
		};
		pageState.data.ticket = 'ticket-123';
		pageState.url = new URL('http://localhost/account') as any;

		initState.isLoading = false;
		initState.error = null;
		initState.needsClub = false;

		global.fetch = vi.fn(async () => new Response(null, { status: 200 }));

		Object.defineProperty(navigator, 'serviceWorker', {
			value: {
				getRegistrations: vi.fn(async () => [])
			},
			configurable: true
		});

		Object.defineProperty(window, 'requestIdleCallback', {
			value: (callback: IdleRequestCallback) => {
				callback({
					didTimeout: false,
					timeRemaining: () => 50
				} as IdleDeadline);
				return 1;
			},
			configurable: true
		});

		Object.defineProperty(window, 'cancelIdleCallback', {
			value: vi.fn(),
			configurable: true
		});
	});

	it('hydrates the auth store from SSR data before the first client render', async () => {
		expect(auth.status).toBe('idle');

		render(Layout);

		expect(auth.status).toBe('authenticated');
		expect(auth.user?.id).toBe('user-123');

		await waitFor(() => {
			expect(initState.initialize).toHaveBeenCalledWith({ serverTicket: 'ticket-123' });
		});
	});

	it('falls back to the guest shell after sign-out even if page.data.user is still populated', async () => {
		const { queryByTestId, getByTestId } = render(Layout);

		expect(queryByTestId('btn-signin')).toBeNull();

		auth.signOut();
		await tick();

		await waitFor(() => {
			expect(getByTestId('btn-signin')).toBeTruthy();
		});
	});
});
