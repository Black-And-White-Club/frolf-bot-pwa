// @vitest-environment jsdom
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountPage from '../src/routes/account/+page.svelte';
import { auth } from '$lib/stores/auth.svelte';
import { page } from '$app/state';
import { goto } from '$app/navigation';

type MockProfile = {
	userId: string;
	displayName: string;
	avatarUrl: string;
	udiscUsername?: string;
	udiscName?: string;
};

const { mockPublish, mockReload, mockGetProfile } = vi.hoisted(() => ({
	mockPublish: vi.fn(),
	mockReload: vi.fn(async () => {}),
	mockGetProfile: vi.fn<(userId: string) => MockProfile | undefined>(() => undefined)
}));

// Mock stores and modules
vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/account') as any
	}
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	auth: {
		isAuthenticated: true,
		status: 'idle',
		canEdit: false,
		canAdmin: false,
		user: {
			id: 'user-123',
			uuid: 'uuid-123',
			role: 'player',
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			clubs: [],
			linkedProviders: []
		}
	}
}));

vi.mock('$lib/stores/club.svelte', () => ({
	clubService: {
		info: { name: 'Test Club' }
	}
}));

vi.mock('$lib/stores/nats.svelte', () => ({
	nats: {
		publish: mockPublish
	}
}));

vi.mock('$lib/stores/dataLoader.svelte', () => ({
	dataLoader: {
		reload: mockReload
	}
}));

vi.mock('$lib/stores/userProfiles.svelte', () => ({
	userProfiles: {
		getProfile: mockGetProfile
	}
}));

// Mock fetch
global.fetch = vi.fn();

describe('Account Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => []
		});
		mockGetProfile.mockReset();
		mockGetProfile.mockReturnValue(undefined);
		// Reset auth state
		auth.isAuthenticated = true;
		auth.canEdit = false;
		auth.canAdmin = false;
		auth.user = {
			id: 'user-123',
			uuid: 'uuid-123',
			role: 'player',
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			clubs: [],
			linkedProviders: []
		};
		// Reset URL
		page.url = new URL('http://localhost/account') as any;
	});

	describe('Connected Accounts', () => {
		it('renders connected accounts section', () => {
			const { getByText, getByRole } = render(AccountPage);

			expect(getByText('Connected Accounts')).toBeTruthy();

			const discordLink = getByRole('link', { name: 'Connect Discord' });
			expect(discordLink.getAttribute('href')).toBe('/api/auth/discord/link');

			const googleLink = getByRole('link', { name: 'Connect Google' });
			expect(googleLink.getAttribute('href')).toBe('/api/auth/google/link');
		});
	});

	describe('Banners', () => {
		it('shows link success banner', () => {
			page.url = new URL('http://localhost/account?success=linked') as any;
			const { getByText } = render(AccountPage);
			expect(getByText(/Provider linked successfully/)).toBeTruthy();
		});

		it('shows link error banner', () => {
			page.url = new URL('http://localhost/account?error=link_failed') as any;
			const { getByText } = render(AccountPage);
			expect(getByText(/Failed to link provider/)).toBeTruthy();
		});

		it('shows no banner by default', () => {
			const { queryByText } = render(AccountPage);
			expect(queryByText(/Provider linked successfully/)).toBeNull();
			expect(queryByText(/Failed to link provider/)).toBeNull();
		});
	});

	describe('UDisc Identity', () => {
		it('hydrates the form from profiles cached under the internal user uuid', () => {
			mockGetProfile.mockImplementation((userId: string) =>
				userId === 'uuid-123'
					? {
							userId,
							displayName: 'Disc User',
							avatarUrl: '',
							udiscUsername: 'disc-user',
							udiscName: 'Disc User'
						}
					: undefined
			);

			const { getByLabelText } = render(AccountPage);

			expect((getByLabelText('UDisc Username') as HTMLInputElement).value).toBe('disc-user');
			expect((getByLabelText('UDisc Display Name') as HTMLInputElement).value).toBe('Disc User');
		});

		it('publishes UDisc identity update request', async () => {
			const { getByLabelText, getByRole } = render(AccountPage);

			await fireEvent.input(getByLabelText('UDisc Username'), {
				target: { value: 'disc-user' }
			});
			await fireEvent.input(getByLabelText('UDisc Display Name'), {
				target: { value: 'Disc User' }
			});
			await fireEvent.click(getByRole('button', { name: 'Save UDisc Identity' }));

			await waitFor(() => {
				expect(mockPublish).toHaveBeenCalledWith(
					'user.udisc.identity.update.requested.v1',
					{
						guild_id: 'club-123',
						user_id: 'user-123',
						username: 'disc-user',
						name: 'Disc User'
					},
					expect.objectContaining({
						correlation_id: expect.any(String),
						submitted_at: expect.any(String),
						source: 'pwa'
					})
				);
			});
			expect(mockReload).not.toHaveBeenCalled();
		});

		it('falls back to guild id when active club uuid is unavailable', async () => {
			auth.user = {
				id: 'user-123',
				uuid: 'uuid-123',
				role: 'player',
				activeClubUuid: '',
				guildId: 'guild-fallback',
				clubs: [],
				linkedProviders: []
			};

			const { getByLabelText, getByRole } = render(AccountPage);
			await fireEvent.input(getByLabelText('UDisc Username'), {
				target: { value: 'disc-user' }
			});
			await fireEvent.click(getByRole('button', { name: 'Save UDisc Identity' }));

			await waitFor(() => {
				expect(mockPublish).toHaveBeenCalledWith(
					'user.udisc.identity.update.requested.v1',
					expect.objectContaining({
						guild_id: 'guild-fallback',
						user_id: 'user-123'
					}),
					expect.objectContaining({
						source: 'pwa'
					})
				);
			});
		});
	});

	describe('Access Control', () => {
		it('redirects unauthenticated users', () => {
			auth.isAuthenticated = false;
			render(AccountPage);
			expect(goto).toHaveBeenCalledWith('/auth/signin');
		});

		it('hides invite section for players', () => {
			auth.canEdit = false;
			const { queryByText } = render(AccountPage);
			expect(queryByText('Invite Links')).toBeNull();
		});

		it('shows invite section for editors', () => {
			auth.canEdit = true;
			const { getByText } = render(AccountPage);
			expect(getByText('Invite Links')).toBeTruthy();
		});

		it('shows invite section for admins', () => {
			auth.canEdit = true;
			const { getByText } = render(AccountPage);
			expect(getByText('Invite Links')).toBeTruthy();
		});
	});

	describe('Brand Compliance', () => {
		it('uses correct fonts', () => {
			const { container } = render(AccountPage);
			// Fraunces for headings
			const h1 = container.querySelector('h1');
			expect(h1?.className).toContain("font-['Fraunces']");

			// Space Grotesk for body/labels
			const p = container.querySelector('p');
			expect(p?.className).toContain("font-['Space_Grotesk']");
		});

		it('uses correct brand colors', () => {
			const { getByRole } = render(AccountPage);
			const btn = getByRole('link', { name: 'Connect Discord' });
			expect(btn.className).toContain('bg-liquid-skobeloff');
		});
	});
});
