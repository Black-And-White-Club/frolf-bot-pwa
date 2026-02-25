// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
	roundService,
	participantFromRaw,
	roundFromRaw,
	type RoundRaw,
	type ParticipantRaw
} from '../round.svelte';

describe('round store - hole-by-hole scores', () => {
	beforeEach(() => {
		roundService.clear();
	});

	describe('participantFromRaw hole score mapping', () => {
		it('maps hole_scores to scores', () => {
			const raw: ParticipantRaw = {
				user_id: 'u1',
				response: 'accepted',
				score: 33,
				tag_number: 5,
				hole_scores: [3, 3, 4, 3, 5, 5, 2, 4, 4]
			};
			const p = participantFromRaw(raw);
			expect(p.scores).toEqual([3, 3, 4, 3, 5, 5, 2, 4, 4]);
		});

		it('omits scores key when hole_scores absent', () => {
			const raw: ParticipantRaw = {
				user_id: 'u1',
				response: 'accepted',
				score: 33,
				tag_number: null
			};
			const p = participantFromRaw(raw);
			expect('scores' in p).toBe(false);
		});

		it('omits scores key when hole_scores is empty array', () => {
			const raw: ParticipantRaw = {
				user_id: 'u1',
				response: 'accepted',
				score: 33,
				tag_number: null,
				hole_scores: []
			};
			const p = participantFromRaw(raw);
			expect('scores' in p).toBe(false);
		});

		it('preserves partial hole_scores as-is (3 of 9 holes)', () => {
			// A UDisc export may only contain scores for holes that were played.
			// We store whatever was provided without padding or validation.
			const raw: ParticipantRaw = {
				user_id: 'u1',
				response: 'accepted',
				score: 10,
				tag_number: null,
				hole_scores: [3, 4, 3]
			};
			const p = participantFromRaw(raw);
			expect(p.scores).toEqual([3, 4, 3]);
			expect(p.scores?.length).toBe(3);
		});
	});

	describe('roundFromRaw par score mapping', () => {
		it('maps par_scores to parValues when par_values absent', () => {
			const raw = {
				id: 'r1',
				guild_id: 'g1',
				title: 'Test',
				location: 'Park',
				description: '',
				start_time: '2025-01-01T00:00:00Z',
				state: 'FINALIZED',
				created_by: 'u1',
				event_message_id: 'msg1',
				participants: [],
				par_scores: [3, 4, 3, 3, 4, 5, 3, 4, 3]
			} as unknown as RoundRaw;

			const round = roundFromRaw(raw);
			expect(round.parValues).toEqual([3, 4, 3, 3, 4, 5, 3, 4, 3]);
		});

		it('prefers par_values over par_scores when both present', () => {
			const raw = {
				id: 'r1',
				guild_id: 'g1',
				title: 'Test',
				location: 'Park',
				description: '',
				start_time: '2025-01-01T00:00:00Z',
				state: 'FINALIZED',
				created_by: 'u1',
				event_message_id: 'msg1',
				participants: [],
				par_values: [3, 3, 3],
				par_scores: [4, 4, 4]
			} as unknown as RoundRaw;

			const round = roundFromRaw(raw);
			expect(round.parValues).toEqual([3, 3, 3]);
		});

		it('leaves parValues undefined when neither par_values nor par_scores present', () => {
			const raw = {
				id: 'r1',
				guild_id: 'g1',
				title: 'Test',
				location: 'Park',
				description: '',
				start_time: '2025-01-01T00:00:00Z',
				state: 'SCHEDULED',
				created_by: 'u1',
				event_message_id: 'msg1',
				participants: []
			} as unknown as RoundRaw;

			const round = roundFromRaw(raw);
			expect(round.parValues).toBeUndefined();
		});
	});

	describe('handleScoresSnapshot with hole scores', () => {
		it('preserves hole_scores on participants after snapshot', () => {
			roundService.addRound({
				id: 'r1',
				guildId: 'g1',
				title: 'Test',
				location: 'Park',
				description: '',
				startTime: new Date().toISOString(),
				state: 'finalized',
				createdBy: 'u1',
				eventMessageId: 'msg1',
				participants: []
			});

			roundService.handleScoresSnapshot({
				roundId: 'r1',
				participants: [
					{
						user_id: 'u1',
						response: 'accepted',
						score: 33,
						tag_number: 5,
						hole_scores: [3, 3, 4, 3, 5, 5, 2, 4, 4]
					}
				]
			});

			expect(roundService.rounds[0].participants[0].scores).toEqual([3, 3, 4, 3, 5, 5, 2, 4, 4]);
		});

		it('preserves partial hole_scores (missing holes rendered as gaps, not errors)', () => {
			roundService.addRound({
				id: 'r1',
				guildId: 'g1',
				title: 'Test',
				location: 'Park',
				description: '',
				startTime: new Date().toISOString(),
				state: 'started',
				createdBy: 'u1',
				eventMessageId: 'msg1',
				participants: []
			});

			roundService.handleScoresSnapshot({
				roundId: 'r1',
				participants: [
					{
						user_id: 'u1',
						response: 'accepted',
						score: 10,
						tag_number: null,
						hole_scores: [3, 4, 3] // only 3 holes
					}
				]
			});

			expect(roundService.rounds[0].participants[0].scores).toEqual([3, 4, 3]);
			expect(roundService.rounds[0].participants[0].scores?.length).toBe(3);
		});
	});

	describe('setRoundsFromApi with hole scores', () => {
		it('maps hole_scores and par_scores from raw API payload', () => {
			const rawRounds = [
				{
					id: 'r1',
					guild_id: 'g1',
					title: 'Test',
					location: 'Park',
					description: '',
					start_time: '2025-01-01T00:00:00Z',
					state: 'FINALIZED',
					created_by: 'u1',
					event_message_id: 'msg1',
					participants: [
						{
							user_id: 'u1',
							response: 'ACCEPT',
							score: 33,
							tag_number: 5,
							hole_scores: [3, 3, 4, 3, 5, 5, 2, 4, 4]
						},
						{
							user_id: 'u2',
							response: 'ACCEPT',
							score: 36,
							tag_number: null
							// no hole_scores — scores key must be absent
						}
					],
					par_scores: [3, 4, 3, 3, 4, 5, 3, 4, 3]
				}
			] as unknown as RoundRaw[];

			roundService.setRoundsFromApi(rawRounds);

			const round = roundService.rounds[0];
			expect(round.parValues).toEqual([3, 4, 3, 3, 4, 5, 3, 4, 3]);
			expect(round.participants[0].scores).toEqual([3, 3, 4, 3, 5, 5, 2, 4, 4]);
			expect('scores' in round.participants[1]).toBe(false);
		});
	});
});
