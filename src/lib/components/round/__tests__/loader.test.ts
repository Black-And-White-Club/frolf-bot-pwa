/* @vitest-environment node */
import { test, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
	vi.resetModules();
});

afterEach(() => {
	vi.restoreAllMocks();
});

test('preloadParticipantDisplay returns cached promise and resolves module', async () => {
	// Provide a preload-queue mock whose enqueuePreload simply runs the task
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	// The sentinel value the loader should resolve to
	const imported = { default: { name: 'ParticipantDisplay' } };

	// Import the loader module and inject a test hook so the dynamic import resolves to our sentinel
	const mod = await import('../participant-loader');
	mod.__TEST_HOOKS.injectedImport = async () => imported;

	const p1 = mod.preloadParticipantDisplay();
	const p2 = mod.preloadParticipantDisplay();
	expect(p1).toBe(p2);
	const resolved = await p1;
	expect(resolved).toBe(imported);
});

test('preloadRoundDetails caches and propagates rejection', async () => {
	// Make enqueuePreload return a rejected promise to simulate a failing dynamic import
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: () => Promise.reject(new Error('simulated import failure'))
	}));

	const mod = await import('../round-details-loader');
	const p = mod.preloadRoundDetails();
	await expect(p).rejects.toBeInstanceOf(Error);
});
