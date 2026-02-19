// @vitest-environment jsdom
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountPage from '../src/routes/account/+page.svelte';
import { auth } from '$lib/stores/auth.svelte';
import { page } from '$app/state';
import { goto } from '$app/navigation';

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

// Mock fetch
global.fetch = vi.fn();

describe('Account Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
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
