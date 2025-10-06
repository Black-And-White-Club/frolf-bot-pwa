/* @vitest-environment jsdom */
import { render } from '@testing-library/svelte';
import { test, expect, vi, afterEach } from 'vitest';
import type { Round } from '$lib/types/backend';

import * as participantLoader from '../participant-loader';
import * as detailsLoader from '../round-details-loader';

// helper - create a simple round
const makeRound = (): Round => ({
	round_id: 'r-branches',
	guild_id: 'g1',
	title: 'Branch Round',
	status: 'scheduled',
	participants: [],
	created_by: 'u1',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	start_time: new Date().toISOString()
});

afterEach(() => {
	vi.restoreAllMocks();
	if (participantLoader.__TEST_HOOKS) participantLoader.__TEST_HOOKS.injectedImport = undefined;
	if (detailsLoader.__TEST_HOOKS) detailsLoader.__TEST_HOOKS.injectedImport = undefined;
	if (participantLoader.__TEST_HOOKS && participantLoader.__TEST_HOOKS.clearCache)
		participantLoader.__TEST_HOOKS.clearCache();
	if (detailsLoader.__TEST_HOOKS && detailsLoader.__TEST_HOOKS.clearCache)
		detailsLoader.__TEST_HOOKS.clearCache();
});

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

	// trigger preload immediately via observeOnce mock
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, cb: () => void) => {
			cb();
			return () => {};
		}
	}));

	const RoundCard = (await import('../RoundCard.svelte')).default;
	const round = makeRound();

	const { getByTestId } = render(RoundCard, {
		props: { round, onRoundClick: () => {}, dataTestId: 'rc-mix' }
	});

	// details fallback should appear (data-testid -details-fallback)
	const detailsFallback = getByTestId('rc-mix-details-fallback');
	expect(detailsFallback).toBeTruthy();

	// Since the details loader rejects the combined Promise.all will reject and the
	// card will show fallback UI for both details and participants.
	const participantsFallback = getByTestId('rc-mix-participants-fallback');
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
