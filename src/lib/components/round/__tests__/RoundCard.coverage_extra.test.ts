/* @vitest-environment jsdom */
import { render } from '@testing-library/svelte';
import { test, expect, vi } from 'vitest';
import type { Round } from '$lib/types/backend';

import * as participantLoader from '../participant-loader';
import * as detailsLoader from '../round-details-loader';

test('div branch with preloaded components renders details and participants', async () => {
	const ParticipantStub = (await import('./stubs/ParticipantStub.svelte')).default;
	const DetailsStub = (await import('./stubs/DetailsStub.svelte')).default;

	// Ensure loader cache is cleared before injection
	if (participantLoader.__TEST_HOOKS?.clearCache) participantLoader.__TEST_HOOKS.clearCache();
	if (detailsLoader.__TEST_HOOKS?.clearCache) detailsLoader.__TEST_HOOKS.clearCache();

	participantLoader.__TEST_HOOKS.injectedImport = async () => ({ default: ParticipantStub });
	detailsLoader.__TEST_HOOKS.injectedImport = async () => ({ default: DetailsStub });

	// trigger preload immediately via observeOnce
	vi.doMock('$lib/utils/viewport', () => ({
		observeOnce: (_el: Element, cb: () => void) => {
			setTimeout(() => cb(), 0);
			return () => {};
		}
	}));

	const RoundCard = (await import('../RoundCard.svelte')).default;
	const round: Round = {
		round_id: 'r-extra',
		guild_id: 'g1',
		title: 'Extra',
		status: 'scheduled',
		participants: [],
		created_by: 'u1',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		start_time: new Date().toISOString()
	} as Round;

	const { findByTestId, getByTestId } = render(RoundCard, {
		props: { round, dataTestId: 'rc-extra' }
	});

	// verify the container is a div (no onRoundClick)
	const container = getByTestId('rc-extra');
	expect(container.tagName).toBe('DIV');

	// stubs should render once preload completes
	const p = await findByTestId('participant-stub', {}, { timeout: 2000 });
	const d = await findByTestId('details-stub', {}, { timeout: 2000 });
	expect(p).toBeTruthy();
	expect(d).toBeTruthy();
});
