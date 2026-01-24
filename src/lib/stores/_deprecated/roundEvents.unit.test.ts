import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Round } from '$lib/types/backend';

describe('roundEvents store - core flows', () => {
	beforeEach(() => {
		// reset module state by re-importing
		vi.resetModules();
	});

	it('initializeRounds sets the rounds store', async () => {
		const mod = await import('$lib/stores/roundEvents');
		const sample: Round[] = [
			{
				round_id: 'r1',
				status: 'active',
				participants: []
			} as unknown as Round
		];
		mod.initializeRounds(sample);
		const rounds = get(mod.rounds);
		expect(rounds.length).toBe(1);
		expect(rounds[0].round_id).toBe('r1');
	});

	it('emitRoundEvent with round_created adds a round after debounce', async () => {
		vi.useFakeTimers();
		const mod = await import('$lib/stores/roundEvents');

		const payload = {
			round: { round_id: 'r2', status: 'scheduled', participants: [] } as unknown as Round
		};
		mod.emitRoundEvent({ type: 'round_created', roundId: 'r2', payload, guildId: 'g1' });

		// advance time to trigger processing
		vi.advanceTimersByTime(200);

		const rounds = get(mod.rounds);
		expect(rounds.find((r: Round) => r.round_id === 'r2')).toBeTruthy();
		vi.useRealTimers();
	});

	it('debounces multiple events and processes the latest', async () => {
		vi.useFakeTimers();
		const mod = await import('$lib/stores/roundEvents');

		// initial round
		mod.initializeRounds([
			{ round_id: 'r3', status: 'active', participants: [] } as unknown as Round
		]);

		// emit two status change events; the latest should win
		mod.emitRoundEvent({
			type: 'round_status_changed',
			roundId: 'r3',
			payload: { updates: { status: 'scheduled' } },
			guildId: 'g1'
		});
		// emit another with later timestamp
		// we simulate by calling emitRoundEvent again which gets a later timestamp
		mod.emitRoundEvent({
			type: 'round_status_changed',
			roundId: 'r3',
			payload: { updates: { status: 'completed' } },
			guildId: 'g1'
		});

		vi.advanceTimersByTime(200);

		const rounds = get(mod.rounds);
		const r = rounds.find((x: Round) => x.round_id === 'r3');
		expect(r).toBeDefined();
		expect(r!.status).toBe('completed');
		vi.useRealTimers();
	});

	it('handles participant join, leave, score updates, and completion', async () => {
		vi.useFakeTimers();
		const mod = await import('$lib/stores/roundEvents');

		mod.initializeRounds([
			{
				round_id: 'r4',
				status: 'active',
				participants: [{ user_id: 'u1', score: 0 }]
			} as unknown as Round
		]);

		// join
		mod.emitRoundEvent({
			type: 'participant_joined',
			roundId: 'r4',
			payload: { participant: { user_id: 'u2', score: 0 } } as Record<string, unknown>,
			guildId: 'g1'
		});
		vi.advanceTimersByTime(200);
		let rounds = get(mod.rounds);
		expect(rounds[0].participants.length).toBe(2);

		// score update
		mod.emitRoundEvent({
			type: 'score_updated',
			roundId: 'r4',
			payload: { userId: 'u2', score: 42 } as Record<string, unknown>,
			guildId: 'g1'
		});
		vi.advanceTimersByTime(200);
		rounds = get(mod.rounds);
		const p = rounds[0].participants.find(
			(x: { user_id: string; score?: number }) => x.user_id === 'u2'
		);
		expect(p).toBeDefined();
		expect(p!.score).toBe(42);

		// participant left
		mod.emitRoundEvent({
			type: 'participant_left',
			roundId: 'r4',
			payload: { userId: 'u1' } as Record<string, unknown>,
			guildId: 'g1'
		});
		vi.advanceTimersByTime(200);
		rounds = get(mod.rounds);
		expect(
			rounds[0].participants.find((x: { user_id: string; score?: number }) => x.user_id === 'u1')
		).toBeUndefined();

		// complete
		mod.emitRoundEvent({
			type: 'round_completed',
			roundId: 'r4',
			payload: {} as Record<string, unknown>,
			guildId: 'g1'
		});
		vi.advanceTimersByTime(200);
		rounds = get(mod.rounds);
		expect(rounds[0].status).toBe('completed');

		vi.useRealTimers();
	});

	it('cleanupRoundEvents cancels pending processing', async () => {
		vi.useFakeTimers();
		const mod = await import('$lib/stores/roundEvents');

		mod.initializeRounds([] as Round[]);
		mod.emitRoundEvent({
			type: 'round_created',
			roundId: 'rx',
			payload: {
				round: { round_id: 'rx', status: 'scheduled', participants: [] } as unknown as Round
			},
			guildId: 'g1'
		});
		// immediately cleanup before timers fire
		mod.cleanupRoundEvents();
		vi.advanceTimersByTime(200);
		const rounds = get(mod.rounds);
		expect(rounds.find((r: Round) => r.round_id === 'rx')).toBeUndefined();
		vi.useRealTimers();
	});
});
