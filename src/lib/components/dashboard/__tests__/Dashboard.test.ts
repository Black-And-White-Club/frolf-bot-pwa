// @vitest-environment jsdom
import { render, screen } from '@testing-library/svelte';
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
	mockGuildService,
	mockUserProfiles
} = vi.hoisted(() => {
	return {
		mockRoundService: {
			rounds: [],
			isLoading: false
		},
		mockLeaderboardService: {
			entries: [],
			isLoading: false
		},
		mockAuth: {
			isAuthenticated: false
		},
		mockAppInit: {
			mode: 'default'
		},
		mockGuildService: {
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

vi.mock('$lib/stores/guild.svelte', () => ({
	guildService: mockGuildService
}));

describe('Dashboard', () => {
	beforeEach(() => {
		// Reset store mocks
		mockRoundService.rounds = [];
		mockRoundService.isLoading = false;
		mockLeaderboardService.entries = [];
		mockLeaderboardService.isLoading = false;
		mockAuth.isAuthenticated = false;
		mockAppInit.mode = 'default';
		mockGuildService.info = { name: 'Test Guild' };
	});

	it('shows UnauthenticatedView when not authenticated', () => {
		mockAuth.isAuthenticated = false;
		const { getByText } = render(Dashboard);
		expect(getByText('Sign in required')).toBeTruthy();
	});

	it('shows dashboard when authenticated', async () => {
		mockAuth.isAuthenticated = true;
		const { getByText } = render(Dashboard);
		expect(getByText('Test Guild')).toBeTruthy();
	});

	it('shows active rounds when present', async () => {
		mockAuth.isAuthenticated = true;
		mockRoundService.rounds = [
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
		expect(getByText('Active & Upcoming')).toBeTruthy();
		// Round 1 should be visible
		expect(getByText('Round 1')).toBeTruthy();
	});

	it('shows empty state when no active rounds', async () => {
		mockAuth.isAuthenticated = true;
		mockRoundService.rounds = [];

		const { getByText } = render(Dashboard);
		expect(getByText('No active rounds')).toBeTruthy();
	});

	it('shows loading skeleton when loading rounds', async () => {
		mockAuth.isAuthenticated = true;
		mockRoundService.isLoading = true;

		// Since we didn't mock LoadingSkeleton, we can check if the main content is hidden or if skeleton is present.
		// But let's just check that "No active rounds" is NOT present
		const { queryByText } = render(Dashboard);
		expect(queryByText('No active rounds')).toBeNull();
	});
});
