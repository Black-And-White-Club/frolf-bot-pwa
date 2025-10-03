// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Round, Participant } from '$lib/types/backend';

// Use fake timers so we can deterministically trigger the debounce processing
beforeEach(() => {
	vi.resetModules();
	vi.useFakeTimers();
	// ensure fresh crypto for randomUUID
	if (!globalThis.crypto) {
		// lightweight stub: cast via unknown to satisfy Crypto shape for tests
		const fakeCrypto = { randomUUID: () => 'stub-uuid', getRandomValues: (arr: Uint8Array) => arr } as unknown as Crypto;
		(globalThis as unknown as { crypto?: Crypto }).crypto = fakeCrypto;
	}
	if (typeof window !== 'undefined') {
		window.localStorage.clear();
		document.documentElement.className = '';
		document.documentElement.style.cssText = '';
	}
});

describe('roundEvents store and processing', () => {
	it('initializeRounds sets initial rounds', async () => {
		const mod = await import('../roundEvents');
		const { initializeRounds, rounds } = mod;

		const r: Partial<Round> = { round_id: 'r1', status: 'active', participants: [] };
		initializeRounds([r as Round]);

		expect(get(rounds)).toHaveLength(1);
		expect(get(rounds)[0].round_id).toBe('r1');
	});

	it('emitRoundEvent -> round_created adds a new round after debounce', async () => {
		const mod = await import('../roundEvents');
		const { initializeRounds, emitRoundEvent, rounds, roundEvents } = mod;

		initializeRounds([]);

		emitRoundEvent({
			type: 'round_created',
			roundId: 'new1',
			payload: { round: { round_id: 'new1', status: 'scheduled', participants: [] } },
			guildId: 'g1',
		});

		// advance timers past debounce window
		vi.advanceTimersByTime(200);

		expect(get(rounds)).toHaveLength(1);
		expect(get(rounds)[0].round_id).toBe('new1');
		expect(get(roundEvents)).toHaveLength(1);
		expect(get(roundEvents)[0].type).toBe('round_created');
	});

	it('participant_joined / participant_left / score_updated are handled', async () => {
		const mod = await import('../roundEvents');
		const { initializeRounds, emitRoundEvent, rounds } = mod;

	const r2: Partial<Round> = { round_id: 'r2', status: 'active', participants: [{ user_id: 'u1', score: 0 } as Participant] };
		initializeRounds([r2 as Round]);

		emitRoundEvent({
			type: 'participant_joined',
			roundId: 'r2',
			payload: { participant: { user_id: 'u2', score: 0 } },
			guildId: 'g1',
		});

		vi.advanceTimersByTime(200);

	expect(get(rounds)[0].participants.some((p: Participant) => p.user_id === 'u2')).toBe(true);

		// score update
		emitRoundEvent({
			type: 'score_updated',
			roundId: 'r2',
			payload: { userId: 'u1', score: 42 },
			guildId: 'g1',
		});

		vi.advanceTimersByTime(200);

	const found = get(rounds)[0].participants.find((p: Participant) => p.user_id === 'u1');
	expect(found).toBeDefined();
	expect(found!.score).toBe(42);

		// participant leaves
		emitRoundEvent({
			type: 'participant_left',
			roundId: 'r2',
			payload: { userId: 'u2' },
			guildId: 'g1',
		});

		vi.advanceTimersByTime(200);

	expect(get(rounds)[0].participants.some((p: Participant) => p.user_id === 'u2')).toBe(false);
	});

	it('round_completed marks round completed and sets completed_at', async () => {
		const mod = await import('../roundEvents');
		const { initializeRounds, emitRoundEvent, rounds } = mod;

		const r3: Partial<Round> = { round_id: 'r3', status: 'active', participants: [] };
		initializeRounds([r3 as Round]);

		emitRoundEvent({
			type: 'round_completed',
			roundId: 'r3',
			payload: {},
			guildId: 'g1',
		});

		vi.advanceTimersByTime(200);

	expect(get(rounds)[0].status).toBe('completed');
	// completed_at is added by the processing as a non-typed property
	expect(typeof (get(rounds)[0] as unknown as { completed_at?: number }).completed_at).toBe('number');
	});

	it('getFilteredEvents returns a derived store filtered by criteria', async () => {
		const mod = await import('../roundEvents');
		const { initializeRounds, emitRoundEvent, getFilteredEvents } = mod;

		initializeRounds([]);

		emitRoundEvent({
			type: 'round_created',
			roundId: 'f1',
			payload: { round: { round_id: 'f1', status: 'scheduled', participants: [] } },
			guildId: 'g-filter',
		});

		vi.advanceTimersByTime(200);

		const derived = getFilteredEvents({ guildId: 'g-filter' });
		const filtered = get(derived);
		expect(Array.isArray(filtered)).toBe(true);
		expect(filtered.length).toBeGreaterThanOrEqual(1);
		// filter by roundId specifically
		const byRound = getFilteredEvents({ roundId: 'f1' });
		expect(get(byRound)[0].roundId).toBe('f1');
	});

	it('cleanupRoundEvents prevents queued events from being processed', async () => {
		const mod = await import('../roundEvents');
		const { initializeRounds, emitRoundEvent, cleanupRoundEvents, rounds, roundEvents } = mod;

		initializeRounds([]);

		emitRoundEvent({
			type: 'round_created',
			roundId: 'will_not_process',
			payload: { round: { round_id: 'will_not_process', status: 'scheduled', participants: [] } },
			guildId: 'g1',
		});

		// immediately cleanup before timers run
		cleanupRoundEvents();

		vi.advanceTimersByTime(300);

		expect(get(rounds)).toHaveLength(0);
		expect(get(roundEvents)).toHaveLength(0);
	});
});
