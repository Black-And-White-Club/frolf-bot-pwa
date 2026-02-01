import { describe, it, expect, beforeEach } from 'vitest';
import { RoundService } from '../round.svelte';

describe('RoundService', () => {
	let roundService: RoundService;

	beforeEach(() => {
		roundService = new RoundService();
	});

	it('adds a round', () => {
		const round = {
			id: 'round-1',
			guildId: 'guild-1',
			title: 'Weekly Tag',
			location: 'Pier Park',
			description: '',
			startTime: '2026-01-25T10:00:00Z',
			state: 'scheduled' as const,
			createdBy: 'user-1',
			eventMessageId: 'msg-1',
			participants: []
		};

		roundService.addRound(round);

		expect(roundService.rounds.length).toBe(1);
		expect(roundService.rounds[0].title).toBe('Weekly Tag');
	});

	it('derives upcoming rounds sorted by start time', () => {
		roundService.addRound({
			id: '2',
			title: 'Later',
			startTime: '2026-01-26T10:00:00Z',
			guildId: 'g',
			location: '',
			description: '',
			state: 'scheduled',
			createdBy: '',
			eventMessageId: '',
			participants: []
		});
		roundService.addRound({
			id: '1',
			title: 'Earlier',
			startTime: '2026-01-25T10:00:00Z',
			guildId: 'g',
			location: '',
			description: '',
			state: 'scheduled',
			createdBy: '',
			eventMessageId: '',
			participants: []
		});

		expect(roundService.upcomingRounds[0].title).toBe('Earlier');
		expect(roundService.upcomingRounds[1].title).toBe('Later');
	});
});
