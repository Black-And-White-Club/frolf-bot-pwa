// @vitest-environment jsdom
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoundList from '../RoundList.svelte';

// Mock SvelteKit environment
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_API_URL: 'http://localhost:8080',
		PUBLIC_NATS_WS_URL: 'ws://localhost:4222'
	}
}));

// Mock stores
const { mockRoundService, mockUserProfiles } = vi.hoisted(() => {
	return {
		mockRoundService: {
			startedRounds: [],
			recentCompletedRounds: [],
			upcomingRounds: [],
			isLoading: false
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

describe('RoundList', () => {
	beforeEach(() => {
		mockRoundService.startedRounds = [];
		mockRoundService.recentCompletedRounds = [];
		mockRoundService.upcomingRounds = [];
		mockRoundService.isLoading = false;
	});

	it('shows active rounds', () => {
		mockRoundService.startedRounds = [
			{
				id: '1',
				title: 'Active Round',
				state: 'started',
				startTime: new Date().toISOString(),
				participants: [],
				location: 'Test Location'
			}
		] as any;

		const { getByText } = render(RoundList);
		expect(getByText('Live Rounds')).toBeTruthy();
		expect(getByText('Active Round')).toBeTruthy();
	});

	it('shows scheduled rounds', () => {
		mockRoundService.upcomingRounds = [
			{
				id: '2',
				title: 'Upcoming Round',
				state: 'scheduled',
				startTime: new Date().toISOString(),
				participants: [],
				location: 'Test Location'
			}
		] as any;

		const { getByText } = render(RoundList);
		expect(getByText('Upcoming Rounds')).toBeTruthy();
		expect(getByText('Upcoming Round')).toBeTruthy();
	});

	it('shows completed rounds', () => {
		mockRoundService.recentCompletedRounds = [
			{
				id: '3',
				title: 'Past Round',
				state: 'finalized',
				startTime: new Date().toISOString(),
				participants: [],
				location: 'Test Location'
			}
		] as any;

		const { getByText } = render(RoundList);
		expect(getByText('Recent Rounds')).toBeTruthy();
		expect(getByText('Past Round')).toBeTruthy();
	});

	it('shows empty state when no rounds', () => {
		mockRoundService.startedRounds = [];
		const { getByText } = render(RoundList);
		expect(getByText('No rounds found')).toBeTruthy();
	});

	it('calls onSelect when round clicked', async () => {
		mockRoundService.startedRounds = [
			{
				id: '1',
				title: 'Active Round',
				state: 'started',
				startTime: new Date().toISOString(),
				participants: [],
				location: 'Test Location'
			}
		] as any;

		const onSelect = vi.fn();
		const { getByText } = render(RoundList, { props: { onSelect } });

		const card = getByText('Active Round');
		await fireEvent.click(card);

		expect(onSelect).toHaveBeenCalledWith('1');
	});
});
