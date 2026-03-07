// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RoundDetail from '../RoundDetail.svelte';

const {
	mockRoundService,
	mockAuth,
	mockRoundActionsService,
	mockUserProfiles,
	mockGoto
} = vi.hoisted(() => ({
	mockRoundService: {
		rounds: [] as any[],
		isLoading: false
	},
	mockAuth: {
		isAuthenticated: false,
		canEdit: false,
		activeRole: 'viewer' as 'viewer' | 'player' | 'editor' | 'admin',
		user: null as null | { id?: string; guildId?: string }
	},
	mockRoundActionsService: {
		errorMessage: null as string | null,
		successMessage: null as string | null,
		isPending: vi.fn(() => false),
		setParticipantResponse: vi.fn(async () => true),
		leaveRound: vi.fn(async () => true),
		submitScore: vi.fn(async () => true),
		updateRound: vi.fn(async () => true),
		deleteRound: vi.fn(async () => true)
	},
	mockUserProfiles: {
		getDisplayName: () => 'Test User',
		getAvatarUrl: () => ''
	},
	mockGoto: vi.fn(async () => {})
}));

vi.mock('$app/navigation', () => ({
	goto: mockGoto
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('$lib/stores/round.svelte', () => ({
	roundService: mockRoundService
}));

vi.mock('$lib/stores/roundActions.svelte', () => ({
	roundActionsService: mockRoundActionsService
}));

vi.mock('$lib/stores/userProfiles.svelte', () => ({
	userProfiles: mockUserProfiles
}));

describe('RoundDetail', () => {
	const baseRound = {
		id: '123',
		title: 'Test Round',
		description: 'Round description',
		location: 'Test Park',
		state: 'scheduled',
		startTime: new Date('2026-03-06T18:30:00.000Z').toISOString(),
		participants: [],
		holes: 18,
		currentHole: 0,
		createdBy: 'owner-1'
	};

	beforeEach(() => {
		mockRoundService.rounds = [structuredClone(baseRound)];
		mockAuth.isAuthenticated = false;
		mockAuth.canEdit = false;
		mockAuth.activeRole = 'viewer';
		mockAuth.user = null;

		mockRoundActionsService.errorMessage = null;
		mockRoundActionsService.successMessage = null;
		mockRoundActionsService.isPending.mockReset();
		mockRoundActionsService.isPending.mockReturnValue(false);
		mockRoundActionsService.setParticipantResponse.mockReset();
		mockRoundActionsService.setParticipantResponse.mockResolvedValue(true);
		mockRoundActionsService.leaveRound.mockReset();
		mockRoundActionsService.leaveRound.mockResolvedValue(true);
		mockRoundActionsService.submitScore.mockReset();
		mockRoundActionsService.submitScore.mockResolvedValue(true);
		mockRoundActionsService.updateRound.mockReset();
		mockRoundActionsService.updateRound.mockResolvedValue(true);
		mockRoundActionsService.deleteRound.mockReset();
		mockRoundActionsService.deleteRound.mockResolvedValue(true);

		mockGoto.mockReset();
	});

	it('renders round details', () => {
		const { getByText } = render(RoundDetail, { props: { roundId: '123' } });
		expect(getByText('Test Round')).toBeTruthy();
		expect(getByText('Round description')).toBeTruthy();
	});

	it('shows empty state when round not found', () => {
		const { getByText } = render(RoundDetail, { props: { roundId: '999' } });
		expect(getByText('Round not found')).toBeTruthy();
	});

	it('submits RSVP action for authenticated players', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = { id: 'player-1', guildId: 'guild-1' };

		const { getByRole } = render(RoundDetail, { props: { roundId: '123' } });
		await fireEvent.click(getByRole('button', { name: 'Join' }));

		expect(mockRoundActionsService.setParticipantResponse).toHaveBeenCalledWith('123', 'ACCEPT');
	});

	it('shows leave action when current user is a participant', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = { id: 'player-1', guildId: 'guild-1' };
		mockRoundService.rounds = [
			{
				...structuredClone(baseRound),
				participants: [{ userId: 'player-1', response: 'accepted', score: null }]
			}
		];

		const { getByRole } = render(RoundDetail, { props: { roundId: '123' } });
		await fireEvent.click(getByRole('button', { name: 'Leave' }));

		expect(mockRoundActionsService.leaveRound).toHaveBeenCalledWith('123');
	});

	it('hides score submission until the current user has joined the started round', () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = { id: 'player-1', guildId: 'guild-1' };
		mockRoundService.rounds = [
			{
				...structuredClone(baseRound),
				state: 'started'
			}
		];

		const { queryByLabelText, queryByRole } = render(RoundDetail, { props: { roundId: '123' } });

		expect(queryByLabelText('Submit score')).toBeNull();
		expect(queryByRole('button', { name: 'Save' })).toBeNull();
	});

	it('allows accepted participants to submit scores for started rounds', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'player';
		mockAuth.user = { id: 'player-1', guildId: 'guild-1' };
		mockRoundService.rounds = [
			{
				...structuredClone(baseRound),
				state: 'started',
				participants: [{ userId: 'player-1', response: 'accepted', score: null }]
			}
		];

		const { getByLabelText, getByRole } = render(RoundDetail, { props: { roundId: '123' } });

		await fireEvent.input(getByLabelText('Submit score'), {
			target: { value: '-4' }
		});
		await fireEvent.click(getByRole('button', { name: 'Save' }));

		expect(mockRoundActionsService.submitScore).toHaveBeenCalledWith('123', -4);
	});

	it('allows round owner editor to request update and delete', async () => {
		mockAuth.isAuthenticated = true;
		mockAuth.activeRole = 'editor';
		mockAuth.canEdit = true;
		mockAuth.user = { id: 'owner-1', guildId: 'guild-1' };

		const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

		const { getByRole } = render(RoundDetail, { props: { roundId: '123' } });

		await fireEvent.click(getByRole('button', { name: 'Edit round' }));
		await fireEvent.click(getByRole('button', { name: 'Save changes' }));
		expect(mockRoundActionsService.updateRound).toHaveBeenCalledWith(
			'123',
			expect.objectContaining({
				title: 'Test Round',
				description: 'Round description',
				location: 'Test Park'
			})
		);

		await fireEvent.click(getByRole('button', { name: 'Delete round' }));
		expect(confirmSpy).toHaveBeenCalledWith('Delete this round? This cannot be undone.');
		expect(mockRoundActionsService.deleteRound).toHaveBeenCalledWith('123');
		await waitFor(() => {
			expect(mockGoto).toHaveBeenCalledWith('/rounds');
		});

		confirmSpy.mockRestore();
	});
});
