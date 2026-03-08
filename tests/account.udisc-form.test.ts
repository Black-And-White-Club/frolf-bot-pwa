// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';

const { mockPublish, pageState } = vi.hoisted(() => ({
	mockPublish: vi.fn(),
	pageState: {
		url: new URL('http://localhost/account') as any
	}
}));

vi.mock('$app/state', () => ({
	page: pageState
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
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

import AccountPage from '../src/routes/account/+page.svelte';
import { auth } from '../src/lib/stores/auth.svelte';
import { userProfiles } from '../src/lib/stores/userProfiles.svelte';

describe('Account page UDisc form syncing', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		pageState.url = new URL('http://localhost/account') as any;

		auth.token = 'ticket-123';
		auth.user = {
			id: 'user-123',
			uuid: 'uuid-123',
			role: 'player',
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			clubs: [{ club_uuid: 'club-123', role: 'player' }],
			linkedProviders: []
		};
		auth.status = 'authenticated';
		auth.error = null;

		userProfiles.clear();
		userProfiles.setProfilesFromApi({
			'uuid-123': {
				user_id: 'uuid-123',
				display_name: 'Disc User',
				avatar_url: '',
				udisc_username: 'old-handle',
				udisc_name: 'Old Name'
			}
		});
	});

	it('does not let stale profile snapshots overwrite an in-flight UDisc edit', async () => {
		const { getByLabelText, getByRole } = render(AccountPage);

		const usernameInput = getByLabelText('UDisc Username') as HTMLInputElement;
		const nameInput = getByLabelText('UDisc Display Name') as HTMLInputElement;

		expect(usernameInput.value).toBe('old-handle');
		expect(nameInput.value).toBe('Old Name');

		await fireEvent.input(usernameInput, { target: { value: 'new-handle' } });
		await fireEvent.input(nameInput, { target: { value: 'New Name' } });
		await fireEvent.click(getByRole('button', { name: 'Save UDisc Identity' }));

		await waitFor(() => {
			expect(mockPublish).toHaveBeenCalledWith(
				'user.udisc.identity.update.requested.v1',
				{
					guild_id: 'club-123',
					user_id: 'user-123',
					username: 'new-handle',
					name: 'New Name'
				},
				expect.objectContaining({
					source: 'pwa'
				})
			);
		});

		userProfiles.setProfilesFromApi({
			'uuid-123': {
				user_id: 'uuid-123',
				display_name: 'Disc User',
				avatar_url: '',
				udisc_username: 'old-handle',
				udisc_name: 'Old Name'
			}
		});
		await tick();

		expect(usernameInput.value).toBe('new-handle');
		expect(nameInput.value).toBe('New Name');

		userProfiles.setProfilesFromApi({
			'uuid-123': {
				user_id: 'uuid-123',
				display_name: 'Disc User',
				avatar_url: '',
				udisc_username: 'new-handle',
				udisc_name: 'New Name'
			}
		});

		await waitFor(() => {
			expect(usernameInput.value).toBe('new-handle');
			expect(nameInput.value).toBe('New Name');
		});
	});
});
