// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Navbar from '../Navbar.svelte';
import { auth } from '$lib/stores/auth.svelte';
import { userProfiles } from '$lib/stores/userProfiles.svelte';

// Mock the stores
vi.mock('$lib/stores/auth.svelte', () => ({
	auth: {
		user: null,
		displayName: 'Guest', // This is a getter in the real class, simplified here
		isAuthenticated: false,
		switchClub: vi.fn(),
		signOut: vi.fn()
	}
}));

vi.mock('$lib/stores/userProfiles.svelte', () => ({
	userProfiles: {
		getProfile: vi.fn(),
		getDisplayName: vi.fn()
	}
}));

// Mock $app/state
vi.mock('$app/state', () => ({
	page: {
		data: { session: null }
	}
}));

// Mock other components
vi.mock('../ThemeToggle.svelte', () => ({ default: () => {} }));
vi.mock('../HamburgerMenu.svelte', () => ({ default: () => {} }));

describe('Navbar Display Name Priority', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		cleanup();
		
		// Setup default auth user
		auth.user = {
			id: 'discord-id-123',
			uuid: 'user-uuid-123',
			activeClubUuid: 'club-uuid-1',
			guildId: 'guild-id-1',
			role: 'player',
			clubs: []
		};
		auth.isAuthenticated = true;
	});

	it('Priority 1: Shows Club Nickname when available', () => {
		// @ts-ignore
		auth.displayName = 'Club Nickname';
		
		// Setup: Profile also exists with other names
		vi.mocked(userProfiles.getProfile).mockReturnValue({
			userId: 'discord-id-123',
			displayName: 'Global Discord Name',
			udiscName: 'UDisc Casual Name',
			udiscUsername: 'udisc_handle',
			avatarUrl: ''
		});

		const { getByText } = render(Navbar);
		expect(getByText('Welcome, Club Nickname!')).toBeTruthy();
	});

	it('Priority 2: Shows UDisc Name when Club Nickname is missing', () => {
		// Setup: Club nickname is fallback (same as ID) or missing
		// @ts-ignore
		auth.displayName = 'discord-id-123'; // Fallback value in auth store
		
		vi.mocked(userProfiles.getProfile).mockReturnValue({
			userId: 'discord-id-123',
			displayName: 'Global Discord Name',
			udiscName: 'UDisc Casual Name',
			udiscUsername: 'udisc_handle',
			avatarUrl: ''
		});

		const { getByText } = render(Navbar);
		expect(getByText('Welcome, UDisc Casual Name!')).toBeTruthy();
	});

	it('Priority 3: Shows UDisc Username when Club Nickname and UDisc Name are missing', () => {
		// Setup: Club nickname fallback
		// @ts-ignore
		auth.displayName = 'discord-id-123';
		
		vi.mocked(userProfiles.getProfile).mockReturnValue({
			userId: 'discord-id-123',
			displayName: 'Global Discord Name',
			udiscName: undefined,
			udiscUsername: 'udisc_handle',
			avatarUrl: ''
		});

		const { getByText } = render(Navbar);
		expect(getByText('Welcome, udisc_handle!')).toBeTruthy();
	});

	it('Priority 4: Shows Global Discord Name when others are missing', () => {
		// Setup: Club nickname fallback
		// @ts-ignore
		auth.displayName = 'discord-id-123';
		
		vi.mocked(userProfiles.getProfile).mockReturnValue({
			userId: 'discord-id-123',
			displayName: 'Global Discord Name',
			udiscName: undefined,
			udiscUsername: undefined,
			avatarUrl: ''
		});

		const { getByText } = render(Navbar);
		expect(getByText('Welcome, Global Discord Name!')).toBeTruthy();
	});

	it('Priority 5: Shows Discord ID as fallback', () => {
		// Setup: Club nickname fallback
		// @ts-ignore
		auth.displayName = 'discord-id-123';
		
		// No profile or empty profile
		vi.mocked(userProfiles.getProfile).mockReturnValue(undefined);

		const { getByText } = render(Navbar);
		expect(getByText('Welcome, discord-id-123!')).toBeTruthy();
	});
});
