/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { addToCalendar } from '$lib/utils/calendar';
import type { Round } from '$lib/types/backend';

describe('addToCalendar behavior', () => {
	type N = { share?: (...args: unknown[]) => Promise<unknown> };
	const makeRound = (): Round =>
		({
			round_id: 'rc1',
			title: 'Cal Round',
			status: 'scheduled',
			participants: [],
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			start_time: new Date().toISOString()
			// optional fields
		}) as unknown as Round;

	it('uses navigator.share when available and does not trigger download', async () => {
		const origNavigator = (globalThis as unknown as { navigator?: unknown }).navigator;
		const origCreate = globalThis.URL.createObjectURL;

		const shareMock = vi.fn().mockResolvedValue(undefined);
		(globalThis as unknown as { navigator?: N }).navigator = { share: shareMock } as N;
		globalThis.URL.createObjectURL = vi.fn();

		// stub anchor click to avoid jsdom navigation
		const restore = (await import('$tests/helpers/test-helpers')).stubAnchorClick();

		addToCalendar(makeRound());

		// allow microtasks to run so promise resolves
		await Promise.resolve();

		expect(shareMock).toHaveBeenCalled();
		expect(globalThis.URL.createObjectURL).not.toHaveBeenCalled();

		// restore
		(globalThis as unknown as { navigator?: unknown }).navigator = origNavigator;
		globalThis.URL.createObjectURL = origCreate;
		restore();
	});

	it('falls back to creating an ics download when navigator.share rejects', async () => {
		const origNavigator = (globalThis as unknown as { navigator?: unknown }).navigator;
		const origCreate = globalThis.URL.createObjectURL;

		const shareMock = vi.fn().mockRejectedValue(new Error('nope'));
		(globalThis as unknown as { navigator?: N }).navigator = { share: shareMock } as N;
		const createSpy = vi.fn();
		globalThis.URL.createObjectURL = createSpy as unknown as typeof globalThis.URL.createObjectURL;

		const restore2 = (await import('$tests/helpers/test-helpers')).stubAnchorClick();

		addToCalendar(makeRound());

		// wait for rejection microtask to trigger fallback
		await Promise.resolve();
		await Promise.resolve();

		expect(shareMock).toHaveBeenCalled();
		expect(createSpy).toHaveBeenCalled();

		// restore
		(globalThis as unknown as { navigator?: unknown }).navigator = origNavigator;
		globalThis.URL.createObjectURL = origCreate;
		restore2();
	});
});
