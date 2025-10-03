/* @vitest-environment jsdom */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { render, waitFor } from '@testing-library/svelte'
import { test, expect } from 'vitest'
import LeaderboardPreview from '../LeaderboardPreview.svelte'
import { MockTransport } from '$lib/stores/mockTransport'

test('shows empty and updates when snapshot arrives', async () => {
  const transport = new MockTransport()
  const { getByText, queryByText } = render(LeaderboardPreview, { props: { transport } })

  // initially empty
  getByText('No snapshot')

  // send snapshot
  const snap = {
    type: 'snapshot', schema: 'leaderboard.v1', version: 1, ts: new Date().toISOString(), payload: {
      id: 'l1', version: 1, lastUpdated: new Date().toISOString(), topTags: [{ tag: 'park', count: 2 }], topPlayers: [{ name: 'Sam', score: 10 }]
    }
  } as any
  await transport.send(snap as any)

  await waitFor(() => expect(queryByText('No snapshot')).toBeNull())
  getByText('Sam — 10')
  getByText('park (2)')
})
