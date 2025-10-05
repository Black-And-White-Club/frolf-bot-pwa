/* @vitest-environment jsdom */
import { render, waitFor } from '@testing-library/svelte';
import { test, expect } from 'vitest';
import LeaderboardPreview from '../LeaderboardPreview.svelte';
import { MockTransport } from '$lib/stores/mockTransport';
import type { Envelope } from '$lib/types/snapshots';

test('shows empty and updates when snapshot arrives', async () => {
	const transport = new MockTransport();
	const { getByText, queryByText } = render(LeaderboardPreview, { props: { transport } });

	// initially empty
	getByText('No snapshot');

	// send snapshot using typed envelope
	const snap: Envelope = {
		type: 'snapshot',
		schema: 'leaderboard.v1',
		version: 1,
		ts: new Date().toISOString(),
		payload: {
			id: 'l1',
			version: 1,
			lastUpdated: new Date().toISOString(),
			topTags: [{ tag: 'park', count: 2 }],
			topPlayers: [{ userId: 'u1', name: 'Sam', score: 10 }]
		}
	};
	await transport.send(snap);

	await waitFor(() => expect(queryByText('No snapshot')).toBeNull());
	getByText('Sam — 10');
	getByText('park (2)');
});
