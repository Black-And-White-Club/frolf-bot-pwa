// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { roundService, type RoundRaw, type Round } from '../round.svelte';

describe('RoundService (round.svelte.ts)', () => {
	beforeEach(() => {
		roundService.clear();
	});

	describe('setRoundsFromApi', () => {
		it('transforms raw API data to internal format', () => {
			const rawRounds = [
				{
					id: 'r1',
					guild_id: 'g1',
					title: 'Sunday Frolf',
					location: 'Park',
					description: 'Fun time',
					start_time: '2023-01-01T10:00:00Z',
					state: 'SCHEDULED',
					created_by: 'u1',
					event_message_id: 'msg1',
					participants: [
						{
							user_id: 'u1',
							response: 'ACCEPTED',
							score: 10,
							tag_number: 5
						},
						{
							user_id: 'u2',
							response: 'DECLINE',
							score: null,
							tag_number: null
						}
					],
					par_values: [3, 3, 3],
					holes: 3,
					current_hole: 1
				}
			] as unknown as RoundRaw[];

			roundService.setRoundsFromApi(rawRounds);

			expect(roundService.rounds.length).toBe(1);
			const round = roundService.rounds[0];

			expect(round.id).toBe('r1');
			expect(round.guildId).toBe('g1');
			expect(round.title).toBe('Sunday Frolf');
			expect(round.startTime).toBe('2023-01-01T10:00:00Z');
			expect(round.state).toBe('scheduled');
			expect(round.parValues).toEqual([3, 3, 3]);
			expect(round.holes).toBe(3);
			expect(round.currentHole).toBe(1);

			expect(round.participants.length).toBe(2);
			expect(round.participants[0]).toEqual({
				userId: 'u1',
				response: 'accepted',
				score: 10,
				tagNumber: 5
			});
			expect(round.participants[1]).toEqual({
				userId: 'u2',
				response: 'declined',
				score: null,
				tagNumber: null
			});
		});

		it('handles various state and response mappings', () => {
			// Cast to unknown first to bypass type checking for invalid values we want to test
			const rawRounds = [
				{
					id: 'r1',
					guild_id: 'g1',
					title: 'R1',
					location: 'L1',
					description: '',
					start_time: null,
					state: 'IN_PROGRESS',
					created_by: 'u1',
					event_message_id: '',
					participants: [
						{ user_id: 'u1', response: 'TENTATIVE', score: null, tag_number: null },
						{ user_id: 'u2', response: 'UNKNOWN', score: null, tag_number: null }
					]
				}
			] as unknown as RoundRaw[];

			roundService.setRoundsFromApi(rawRounds);
			const round = roundService.rounds[0];

			expect(round.state).toBe('started');
			expect(round.participants[0].response).toBe('tentative');
			expect(round.participants[1].response).toBe('tentative'); // Fallback
			expect(round.startTime).toBeDefined(); // Fallback to now
		});
	});

	describe('CRUD operations', () => {
		const mockRound: Round = {
			id: 'r1',
			guildId: 'g1',
			title: 'Test Round',
			location: 'Loc',
			description: 'Desc',
			startTime: new Date().toISOString(),
			state: 'scheduled',
			createdBy: 'u1',
			eventMessageId: 'evt1',
			participants: []
		};

		it('addRound adds a round if not duplicate', () => {
			roundService.addRound(mockRound);
			expect(roundService.rounds.length).toBe(1);

			// Duplicate ignored
			roundService.addRound(mockRound);
			expect(roundService.rounds.length).toBe(1);
		});

		it('updateRound modifies existing round', () => {
			roundService.addRound(mockRound);
			roundService.updateRound('r1', { title: 'Updated Title' });

			expect(roundService.rounds[0].title).toBe('Updated Title');
		});

		it('removeRound removes round by id', () => {
			roundService.addRound(mockRound);
			roundService.removeRound('r1');
			expect(roundService.rounds.length).toBe(0);
		});
	});

	describe('Participant operations', () => {
		let mockRound: Round;

		beforeEach(() => {
			mockRound = {
				id: 'r1',
				guildId: 'g1',
				title: 'Test Round',
				location: 'Loc',
				description: 'Desc',
				startTime: new Date().toISOString(),
				state: 'scheduled',
				createdBy: 'u1',
				eventMessageId: 'evt1',
				participants: []
			};
			roundService.addRound(mockRound);
		});

		it('addParticipant adds participant if not exists', () => {
			const p = { userId: 'u1', response: 'accepted' as const, score: 0, tagNumber: 1 };
			roundService.addParticipant('r1', p);

			expect(roundService.rounds[0].participants.length).toBe(1);
			expect(roundService.rounds[0].participants[0].userId).toBe('u1');

			// Duplicate ignored
			roundService.addParticipant('r1', p);
			expect(roundService.rounds[0].participants.length).toBe(1);
		});

		it('updateParticipant modifies existing participant', () => {
			const p = { userId: 'u1', response: 'accepted' as const, score: 0, tagNumber: 1 };
			roundService.addParticipant('r1', p);

			roundService.updateParticipant('r1', 'u1', { score: 5 });
			expect(roundService.rounds[0].participants[0].score).toBe(5);
		});

		it('handleScoresSnapshot replaces participants from raw payload', () => {
			const p = { userId: 'u1', response: 'accepted' as const, score: 0, tagNumber: 1 };
			roundService.addParticipant('r1', p);

			roundService.handleScoresSnapshot({
				roundId: 'r1',
				participants: [
					{ user_id: 'u2', response: 'accepted', score: -3, tag_number: 9 },
					{
						user_id: '',
						response: 'accepted',
						score: 4,
						tag_number: null,
						raw_name: 'Guest Player'
					}
				]
			});

			expect(roundService.rounds[0].participants).toEqual([
				{ userId: 'u2', response: 'accepted', score: -3, tagNumber: 9 },
				{ userId: '', response: 'accepted', score: 4, tagNumber: null }
			]);
		});

		it('removeParticipant removes participant', () => {
			const p = { userId: 'u1', response: 'accepted' as const, score: 0, tagNumber: 1 };
			roundService.addParticipant('r1', p);

			roundService.removeParticipant('r1', 'u1');
			expect(roundService.rounds[0].participants.length).toBe(0);
		});
	});

	describe('Derived state', () => {
		it('categorizes rounds correctly', () => {
			const now = Date.now();
			const r1: Round = {
				id: 'r1',
				state: 'scheduled',
				startTime: new Date(now + 1000).toISOString(),
				guildId: 'g1',
				title: 'R1',
				location: '',
				description: '',
				createdBy: '',
				eventMessageId: '',
				participants: []
			};
			const r2: Round = {
				id: 'r2',
				state: 'started',
				startTime: new Date(now).toISOString(),
				guildId: 'g1',
				title: 'R2',
				location: '',
				description: '',
				createdBy: '',
				eventMessageId: '',
				participants: []
			};
			const r3: Round = {
				id: 'r3',
				state: 'finalized',
				startTime: new Date(now - 1000).toISOString(),
				guildId: 'g1',
				title: 'R3',
				location: '',
				description: '',
				createdBy: '',
				eventMessageId: '',
				participants: []
			};

			roundService.setRounds([r1, r2, r3]);

			expect(roundService.activeRound?.id).toBe('r2');
			expect(roundService.upcomingRounds.length).toBe(1);
			expect(roundService.upcomingRounds[0].id).toBe('r1');
			expect(roundService.pastRounds.length).toBe(1);
			expect(roundService.pastRounds[0].id).toBe('r3');
		});

		it('upcomingRounds are sorted by date', () => {
			const now = Date.now();
			const r1: Round = {
				id: 'r1',
				state: 'scheduled',
				startTime: new Date(now + 2000).toISOString(),
				guildId: 'g1',
				title: 'R1',
				location: '',
				description: '',
				createdBy: '',
				eventMessageId: '',
				participants: []
			};
			const r2: Round = {
				id: 'r2',
				state: 'scheduled',
				startTime: new Date(now + 1000).toISOString(),
				guildId: 'g1',
				title: 'R2',
				location: '',
				description: '',
				createdBy: '',
				eventMessageId: '',
				participants: []
			};

			roundService.setRounds([r1, r2]);

			expect(roundService.upcomingRounds[0].id).toBe('r2');
			expect(roundService.upcomingRounds[1].id).toBe('r1');
		});
	});
});
