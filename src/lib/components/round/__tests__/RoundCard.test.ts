/* @vitest-environment jsdom */
import { render, fireEvent } from '@testing-library/svelte';
import { test, expect, vi, afterEach } from 'vitest';
import type { Round } from '$lib/types/backend';

import * as participantLoader from '../participant-loader';
import * as detailsLoader from '../round-details-loader';

afterEach(() => {
	vi.restoreAllMocks();
	// clear loader hooks synchronously to avoid leaking state between tests
	if (participantLoader.__TEST_HOOKS) participantLoader.__TEST_HOOKS.injectedImport = undefined;
	if (detailsLoader.__TEST_HOOKS) detailsLoader.__TEST_HOOKS.injectedImport = undefined;

	// reset module-level cached promises so preload runs fresh in each test
	if (participantLoader.__TEST_HOOKS && participantLoader.__TEST_HOOKS.clearCache)
		participantLoader.__TEST_HOOKS.clearCache();
	if (detailsLoader.__TEST_HOOKS && detailsLoader.__TEST_HOOKS.clearCache)
		detailsLoader.__TEST_HOOKS.clearCache();
});

const makeRound = (): Round => ({
	round_id: 'r-branch',
	guild_id: 'g1',
	title: 'Branch Round',
	status: 'scheduled',
	participants: [],
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	start_time: new Date().toISOString()
});

test('renders as button when onRoundClick provided and responds to click', async () => {
	// Use loader test hooks to avoid importing Svelte components during this test
	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	const ParticipantStub = (await import('./stubs/ParticipantStub.svelte')).default;
	const DetailsStub = (await import('./stubs/DetailsStub.svelte')).default;
	participantLoader.__TEST_HOOKS.injectedImport = async () => ({ default: ParticipantStub });
	detailsLoader.__TEST_HOOKS.injectedImport = async () => ({ default: DetailsStub });

	const RoundCard = (await import('../RoundCard.svelte')).default;
	const round = makeRound();
	const onRoundClick = vi.fn();
	const { getByRole } = render(RoundCard, { props: { round, onRoundClick } });
	const btn = getByRole('button', { name: `Round ${round.title}` });
	await fireEvent.click(btn);
	expect(onRoundClick).toHaveBeenCalled();
});

test('renders as div when no onRoundClick and keydown handler does not exist', async () => {
	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	const ParticipantStub = (await import('./stubs/ParticipantStub.svelte')).default;
	const DetailsStub = (await import('./stubs/DetailsStub.svelte')).default;
	participantLoader.__TEST_HOOKS.injectedImport = async () => ({ default: ParticipantStub });
	detailsLoader.__TEST_HOOKS.injectedImport = async () => ({ default: DetailsStub });

	const RoundCard = (await import('../RoundCard.svelte')).default;
	const { container } = render(RoundCard, { props: { round: makeRound() } });
	const div = container.querySelector('div[aria-label]');
	expect(div).toBeTruthy();
});

test('renders as button with skeleton placeholders when preload not started', async () => {
	// mock observeOnce to never call the callback
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, _cb: (entry: IntersectionObserverEntry) => void) => {
			void _el;
			void _cb;
			return () => {};
		}
	}));

	// Use loader hooks so the real loader is used but it won't import Svelte components
	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	const ParticipantStub = (await import('./stubs/ParticipantStub.svelte')).default;
	const DetailsStub = (await import('./stubs/DetailsStub.svelte')).default;
	participantLoader.__TEST_HOOKS.injectedImport = async () => ({ default: ParticipantStub });
	detailsLoader.__TEST_HOOKS.injectedImport = async () => ({ default: DetailsStub });

	const RoundCard = (await import('../RoundCard.svelte')).default;

	const round = makeRound();
	const { container, getByTestId } = render(RoundCard, {
		props: { round, onRoundClick: () => {}, dataTestId: 'rc-branch-1' }
	});

	const btn = getByTestId('rc-branch-1');
	expect(btn).toBeTruthy();

	const placeholders = container.querySelectorAll('div[aria-hidden="true"]');
	expect(placeholders.length).toBeGreaterThanOrEqual(1);
});

test('when preload starts and imports fail, RoundCard shows fallback details and loading participants', async () => {
	// mock observeOnce to call the callback async to start preload
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, cb: (entry: IntersectionObserverEntry) => void) => {
			void _el;
			// Trigger callback asynchronously to simulate intersection
			setTimeout(() => cb({} as unknown as IntersectionObserverEntry), 0);
			return () => {};
		}
	}));

	// Setup loader hooks to throw when attempted (simulate import failures)
	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	participantLoader.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('fail participants');
	};
	detailsLoader.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('fail details');
	};

	const RoundCard = (await import('../RoundCard.svelte')).default;

	const round = makeRound();
	const { getByTestId } = render(RoundCard, {
		props: { round, onRoundClick: () => {}, dataTestId: 'rc-branch-2' }
	});

	// Wait for intersection observer and preload to execute
	await new Promise((resolve) => setTimeout(resolve, 50));

	// Should show fallback elements with proper testids
	const detailsFound = getByTestId('rc-branch-2-details-fallback');
	const participantsFound = getByTestId('rc-branch-2-participants-fallback');
	expect(detailsFound).toBeTruthy();
	expect(participantsFound).toBeTruthy();
});

test('renders as div when onRoundClick is not provided', async () => {
	// mock observeOnce so it doesn't call the callback
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, _cb: (entry: IntersectionObserverEntry) => void) => {
			void _el;
			void _cb;
			return () => {};
		}
	}));

	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	const ParticipantStub = (await import('./stubs/ParticipantStub.svelte')).default;
	const DetailsStub = (await import('./stubs/DetailsStub.svelte')).default;
	participantLoader.__TEST_HOOKS.injectedImport = async () => ({ default: ParticipantStub });
	detailsLoader.__TEST_HOOKS.injectedImport = async () => ({ default: DetailsStub });

	const RoundCard = (await import('../RoundCard.svelte')).default;
	const round = makeRound();
	const { getByTestId } = render(RoundCard, {
		props: { round, dataTestId: 'rc-branch-3' }
	});

	const el = getByTestId('rc-branch-3');
	expect(el.tagName).toBe('DIV');
});

test('keyboard activation (Enter/Space) triggers onRoundClick when provided', async () => {
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, _cb: (entry: IntersectionObserverEntry) => void) => {
			void _el;
			void _cb;
			return () => {};
		}
	}));

	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	participantLoader.__TEST_HOOKS.injectedImport = async () => null;
	detailsLoader.__TEST_HOOKS.injectedImport = async () => null;

	const RoundCard = (await import('../RoundCard.svelte')).default;

	const handler = vi.fn();
	const round = makeRound();
	const { getByTestId } = render(RoundCard, {
		props: { round, onRoundClick: handler, dataTestId: 'rc-branch-4' }
	});

	const btn = getByTestId('rc-branch-4');

	await fireEvent.keyDown(btn, { key: 'Enter' });
	expect(handler).toHaveBeenCalledWith({ roundId: round.round_id });

	handler.mockClear();
	await fireEvent.keyDown(btn, { key: ' ' });
	expect(handler).toHaveBeenCalledWith({ roundId: round.round_id });
});

test('interaction: click and Enter key trigger provided handler via data-testid', async () => {
	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	participantLoader.__TEST_HOOKS.injectedImport = async () => null;
	detailsLoader.__TEST_HOOKS.injectedImport = async () => null;

	const RoundCard = (await import('../RoundCard.svelte')).default;
	const handler = vi.fn();
	const round = { ...makeRound(), round_id: 'r-100', title: 'Morning Round' } as Round;
	const { getByTestId } = render(RoundCard, {
		props: { round, onRoundClick: handler, dataTestId: 'rc-1' }
	});
	const el = getByTestId('rc-1');
	await fireEvent.click(el);
	expect(handler).toHaveBeenCalledWith({ roundId: 'r-100' });

	handler.mockClear();
	const { getByTestId: getByTestId2 } = render(RoundCard, {
		props: { round, onRoundClick: handler, dataTestId: 'rc-2' }
	});
	const el2 = getByTestId2('rc-2');
	await fireEvent.keyDown(el2, { key: 'Enter' });
	expect(handler).toHaveBeenCalledWith({ roundId: 'r-100' });
});

test('preload branch: loader injection resolves and loader promises are truthy', async () => {
	// Create actual Svelte component stubs using Svelte syntax
	const ParticipantStub = (await import('./stubs/ParticipantStub.svelte')).default;
	const DetailsStub = (await import('./stubs/DetailsStub.svelte')).default;

	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	participantLoader.__TEST_HOOKS.injectedImport = async () => ({ default: ParticipantStub });
	detailsLoader.__TEST_HOOKS.injectedImport = async () => ({ default: DetailsStub });

	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, cb: () => void) => {
			setTimeout(() => cb(), 0);
			return () => {};
		}
	}));

	const round = makeRound();
	const RoundCard = (await import('../RoundCard.svelte')).default;
	const { findByTestId } = render(RoundCard, { props: { round, dataTestId: 'rc-pre' } });

	// Wait for preload to complete and components to render (give a longer timeout)
	const participantStub = await findByTestId('participant-stub', {}, { timeout: 2000 });
	const detailsStub = await findByTestId('details-stub', {}, { timeout: 2000 });
	expect(participantStub).toBeTruthy();
	expect(detailsStub).toBeTruthy();
});

test('loader injection failure falls back gracefully', async () => {
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, cb: () => void) => {
			setTimeout(() => cb(), 0);
			return () => {};
		}
	}));

	const participantLoader = await import('../participant-loader');
	const detailsLoader = await import('../round-details-loader');
	participantLoader.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('fail import');
	};
	detailsLoader.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('fail import');
	};

	const round = makeRound();
	const RoundCard = (await import('../RoundCard.svelte')).default;
	const { getByTestId, findByText } = render(RoundCard, {
		props: { round, dataTestId: 'rc-pre-2' }
	});

	await new Promise((r) => setTimeout(r, 200));

	expect(getByTestId('rc-pre-2')).toBeTruthy();
	// Should show fallback text (allow extra time for render). Match ellipsis or plain dots.
	const fallback = await findByText(/Loading participants[\u2026.]*?/i, {}, { timeout: 1500 });
	expect(fallback).toBeTruthy();
});

// --- Branch-focused tests (moved from RoundCard.branches.test.ts) -----------------
test('preload failure when one loader rejects shows fallbacks (button branch)', async () => {
	// make preload-queue run tasks immediately for deterministic timing
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	const ParticipantStub = (await import('./stubs/ParticipantStub.svelte')).default;

	const pLoader = await import('../participant-loader');
	const dLoader = await import('../round-details-loader');
	// ensure we start with a fresh module-level cache so our injectedImport is used
	if (pLoader.__TEST_HOOKS.clearCache) pLoader.__TEST_HOOKS.clearCache();
	if (dLoader.__TEST_HOOKS.clearCache) dLoader.__TEST_HOOKS.clearCache();

	// participants succeed
	pLoader.__TEST_HOOKS.injectedImport = async () => ({ default: ParticipantStub });

	// details fail
	dLoader.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('details fail');
	};

	// make observeOnce capture the callback so we can invoke it after mount
	let savedCb: (() => void) | undefined;
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, cb: () => void) => {
			savedCb = cb;
			return () => {};
		}
	}));

	const RoundCard = (await import('../RoundCard.svelte')).default;
	const round = makeRound();

	const { findByTestId } = render(RoundCard, {
		props: { round, onRoundClick: () => {}, dataTestId: 'rc-mix' }
	});

	// invoke the captured callback to start preload after onMount has run
	if (savedCb) savedCb();

	// details fallback should appear (data-testid -details-fallback)
	const detailsFallback = await findByTestId('rc-mix-details-fallback', {}, { timeout: 1000 });
	expect(detailsFallback).toBeTruthy();

	// Since the details loader rejects the combined Promise.all will reject and the
	// card will show fallback UI for both details and participants.
	const participantsFallback = await findByTestId(
		'rc-mix-participants-fallback',
		{},
		{ timeout: 1000 }
	);
	expect(participantsFallback).toBeTruthy();
});

test('div branch preload failure shows inline fallbacks', async () => {
	// ensure preload tasks run immediately
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	// trigger preload via observeOnce asynchronously
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, cb: () => void) => {
			setTimeout(() => cb(), 0);
			return () => {};
		}
	}));

	const pLoader = await import('../participant-loader');
	const dLoader = await import('../round-details-loader');
	if (pLoader.__TEST_HOOKS.clearCache) pLoader.__TEST_HOOKS.clearCache();
	if (dLoader.__TEST_HOOKS.clearCache) dLoader.__TEST_HOOKS.clearCache();
	pLoader.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('p fail');
	};
	dLoader.__TEST_HOOKS.injectedImport = async () => {
		throw new Error('d fail');
	};

	const RoundCard = (await import('../RoundCard.svelte')).default;
	const { findByText, getByTestId } = render(RoundCard, {
		props: { round: makeRound(), dataTestId: 'rc-div' }
	});

	// wait for the element to appear
	await new Promise((r) => setTimeout(r, 50));

	// the outer container exists
	expect(getByTestId('rc-div')).toBeTruthy();

	// details inline fallback (div branch) should show 'Details …' (allow various ellipsis)
	const details = await findByText(/Details\s*[.\u2026]?/i, {}, { timeout: 1000 });
	expect(details).toBeTruthy();

	const participants = await findByText(/Loading participants[.\u2026]?/i, {}, { timeout: 1000 });
	expect(participants).toBeTruthy();
});

test('loader cache: importer called only once across multiple renders', async () => {
	vi.doMock('$lib/utils/preload-queue', () => ({
		enqueuePreload: (task: () => Promise<unknown>) => task()
	}));

	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, cb: () => void) => {
			cb();
			return () => {};
		}
	}));

	const ParticipantStub = (await import('./stubs/ParticipantStub.svelte')).default;
	const pLoader = await import('../participant-loader');
	const dLoader = await import('../round-details-loader');
	if (pLoader.__TEST_HOOKS.clearCache) pLoader.__TEST_HOOKS.clearCache();
	if (dLoader.__TEST_HOOKS.clearCache) dLoader.__TEST_HOOKS.clearCache();

	let importCount = 0;
	pLoader.__TEST_HOOKS.injectedImport = async () => {
		importCount++;
		return { default: ParticipantStub };
	};
	dLoader.__TEST_HOOKS.injectedImport = async () => null;

	const RoundCard = (await import('../RoundCard.svelte')).default;

	// first render triggers preload
	const { findByTestId } = render(RoundCard, {
		props: { round: makeRound(), dataTestId: 'rc-cache-1' }
	});
	await findByTestId('participant-stub', {}, { timeout: 2000 });

	// second render should reuse cached participantPromise and not call importer again
	const { findByTestId: find2 } = render(RoundCard, {
		props: { round: makeRound(), dataTestId: 'rc-cache-2' }
	});
	await find2('participant-stub', {}, { timeout: 2000 });

	expect(importCount).toBe(1);
});
