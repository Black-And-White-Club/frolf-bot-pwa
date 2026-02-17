// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../Dashboard.svelte';

// Mock SvelteKit environment
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_URL: 'http://localhost:8080',
		PUBLIC_NATS_WS_URL: 'ws://localhost:4222'
	}
}));

// Mock stores
const {
	mockRoundService,
	mockLeaderboardService,
	mockAuth,
	mockAppInit,
	mockClubService,
	mockUserProfiles
} = vi.hoisted(() => {
	return {
		mockRoundService: {
			startedRounds: [],
			recentCompletedRounds: [],
			upcomingRounds: [],
			isLoading: false
		},
		mockLeaderboardService: {
			entries: [],
			currentView: [],
			viewMode: 'points',
			isLoading: false
		},
		mockAuth: {
			isAuthenticated: true,
			user: { id: 'u1' }
		},
		mockAppInit: {
			mode: 'default'
		},
		mockClubService: {
			info: { name: 'Test Guild' }
		},
		mockUserProfiles: {
			getDisplayName: () => 'Test User',
			getAvatarUrl: () => 'https://example.com/avatar.png'
		}
	};
});

vi.mock('$lib/stores/round.svelte', () => ({
	roundService: mockRoundService
}));

vi.mock('$lib/stores/userProfiles.svelte', () => ({
	userProfiles: mockUserProfiles
}));

vi.mock('$lib/stores/leaderboard.svelte', () => ({
	leaderboardService: mockLeaderboardService
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	auth: mockAuth
}));

vi.mock('$lib/stores/init.svelte', () => ({
	appInit: mockAppInit
}));

vi.mock('$lib/stores/club.svelte', () => ({
	clubService: mockClubService
}));

vi.mock('$lib/stores/tags.svelte', () => ({
	tagStore: {
		selectMember: vi.fn(),
		selectedMemberId: null
	}
}));

describe('Dashboard', () => {
	beforeEach(() => {
		// Reset store mocks
		mockRoundService.startedRounds = [];
		mockRoundService.recentCompletedRounds = [];
		mockRoundService.upcomingRounds = [];
		mockRoundService.isLoading = false;
		mockLeaderboardService.entries = [];
		mockLeaderboardService.currentView = [];
		mockLeaderboardService.viewMode = 'points';
		mockLeaderboardService.isLoading = false;
		mockAuth.isAuthenticated = true;
	});

	it('renders dashboard with leaderboard', async () => {
		const { getByText } = render(Dashboard);
		expect(getByText('Points Leaderboard')).toBeTruthy();
	});

	it('shows live rounds when present', async () => {
		mockRoundService.startedRounds = [
			{
				id: '1',
				title: 'Round 1',
				state: 'started',
				startTime: new Date().toISOString(),
				participants: [],
				location: 'Test Location'
			}
		] as any;

		const { getByText } = render(Dashboard);
		expect(getByText('Live Rounds')).toBeTruthy();
		expect(getByText('Round 1')).toBeTruthy();
	});

	it('shows empty state when no rounds', async () => {
		mockRoundService.startedRounds = [];
		mockRoundService.recentCompletedRounds = [];

		const { getByText } = render(Dashboard);
		expect(getByText('No rounds found')).toBeTruthy();
	});

	it('shows loading skeleton when loading rounds', async () => {
		mockRoundService.isLoading = true;

		const { queryByText } = render(Dashboard);
		expect(queryByText('No rounds found')).toBeNull();
	});
});
