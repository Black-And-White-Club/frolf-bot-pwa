// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TagEditor from '../TagEditor.svelte';

const { mockAdminStore, mockAuth, mockTagStore, mockUserProfiles } = vi.hoisted(() => {
	return {
		mockAdminStore: {
			loading: false,
			successMessage: null as string | null,
			errorMessage: null as string | null,
			submitTagAssignments: vi.fn()
		},
		mockAuth: {
			user: null as { activeClubUuid?: string; guildId?: string; id?: string } | null
		},
		mockTagStore: {
			tagList: [] as Array<{ memberId: string; currentTag: number | null }>,
			loading: false,
			error: null as string | null
		},
		mockUserProfiles: {
			getDisplayName: vi.fn((memberId: string) => memberId),
			getAvatarUrl: vi.fn(() => '')
		}
	};
});

vi.mock('$lib/stores/admin.svelte', () => ({
	adminStore: mockAdminStore
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('$lib/stores/tags.svelte', () => ({
	tagStore: mockTagStore
}));

vi.mock('$lib/stores/userProfiles.svelte', () => ({
	userProfiles: mockUserProfiles
}));

describe('TagEditor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockAdminStore.loading = false;
		mockAdminStore.successMessage = null;
		mockAdminStore.errorMessage = null;
		mockAdminStore.submitTagAssignments.mockResolvedValue(undefined);
		mockAuth.user = {
			activeClubUuid: 'club-123',
			guildId: 'guild-123',
			id: 'admin-123'
		};
		mockTagStore.loading = false;
		mockTagStore.error = null;
		mockTagStore.tagList = [{ memberId: 'member-456', currentTag: 7 }];
		mockUserProfiles.getDisplayName.mockImplementation((memberId: string) =>
			memberId === 'member-456' ? 'Member One' : memberId
		);
	});

	it('submit button has correct brand classes for light-mode visibility', () => {
		const { getByRole } = render(TagEditor);
		const btn = getByRole('button', { name: /submit batch/i });
		expect(btn.className).toContain('bg-liquid-skobeloff');
		expect(btn.className).toContain('text-white');
	});

	it('submit button is disabled when there are no changes', () => {
		const { getByRole } = render(TagEditor);
		const btn = getByRole('button', { name: /submit batch/i }) as HTMLButtonElement;
		expect(btn.disabled).toBe(true);
	});

	it('submit button is enabled after making a change', async () => {
		const { getByRole, getAllByRole } = render(TagEditor);
		const inputs = getAllByRole('spinbutton') as HTMLInputElement[];
		await fireEvent.input(inputs[0], { target: { value: '5' } });
		const btn = getByRole('button', { name: /submit batch/i }) as HTMLButtonElement;
		expect(btn.disabled).toBe(false);
	});
});
