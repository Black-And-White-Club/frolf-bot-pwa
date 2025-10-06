/* @vitest-environment node */
import { test, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
	vi.resetModules();
});

afterEach(() => {
	vi.restoreAllMocks();
});

test('preloadParticipantDisplay returns cached promise and resolves module', async () => {
	// Mock preload-queue to execute tasks immediately
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	// Prepare a fake component module and inject via the loader test hook
	const mockComponent = { default: { name: 'ParticipantDisplay' } };
	const mod = await import('../participant-loader');
	mod.__TEST_HOOKS.injectedImport = async () => mockComponent as unknown as Promise<unknown>;

	// Call preload twice and verify it returns the same cached promise
	const p1 = mod.preloadParticipantDisplay();
	const p2 = mod.preloadParticipantDisplay();
	expect(p1).toBe(p2);

	// Verify the promise resolves to the mocked component
	const resolved = await p1;
	expect(resolved).toBe(mockComponent);
});

test('preloadParticipantDisplay handles import failures gracefully', async () => {
	// Mock preload-queue to execute tasks immediately
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	// Inject a failing importer via test hooks
	const mod = await import('../participant-loader');
	mod.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('simulated import failure');
	};

	const p = mod.preloadParticipantDisplay();
	// Should reject when import fails
	await expect(p).rejects.toThrow('simulated import failure');
});

test('preloadRoundDetails returns cached promise and resolves module', async () => {
	// Mock preload-queue to execute tasks immediately
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	const mockComponent = { default: { name: 'RoundDetails' } };
	const mod = await import('../round-details-loader');
	mod.__TEST_HOOKS.injectedImport = async () => mockComponent as unknown as Promise<unknown>;

	// Call preload twice and verify it returns the same cached promise
	const p1 = mod.preloadRoundDetails();
	const p2 = mod.preloadRoundDetails();
	expect(p1).toBe(p2);

	// Verify the promise resolves to the mocked component
	const resolved = await p1;
	expect(resolved).toBe(mockComponent);
});

test('preloadRoundDetails caches and propagates rejection', async () => {
	// Mock preload-queue to execute tasks immediately
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	const mod = await import('../round-details-loader');
	mod.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('simulated import failure');
	};

	const p = mod.preloadRoundDetails();
	// Should reject and cache the rejection
	await expect(p).rejects.toThrow('simulated import failure');
});

test('preload functions cache promises across multiple imports', async () => {
	const mockParticipant = { default: { name: 'ParticipantDisplay' } };
	const mockDetails = { default: { name: 'RoundDetails' } };

	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	const participantMod = await import('../participant-loader');
	const detailsMod = await import('../round-details-loader');

	participantMod.__TEST_HOOKS.injectedImport = async () =>
		mockParticipant as unknown as Promise<unknown>;
	detailsMod.__TEST_HOOKS.injectedImport = async () => mockDetails as unknown as Promise<unknown>;

	// First calls create the cached promises
	const p1 = participantMod.preloadParticipantDisplay();
	const d1 = detailsMod.preloadRoundDetails();

	// Subsequent calls return the same promises
	const p2 = participantMod.preloadParticipantDisplay();
	const d2 = detailsMod.preloadRoundDetails();

	expect(p1).toBe(p2);
	expect(d1).toBe(d2);

	// Verify they resolve correctly
	await expect(p1).resolves.toBe(mockParticipant);
	await expect(d1).resolves.toBe(mockDetails);
});
