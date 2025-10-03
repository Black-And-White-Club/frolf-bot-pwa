/* @vitest-environment jsdom */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from '@testing-library/svelte'
import { test, expect } from 'vitest'
import ParticipantDisplay from '../round/ParticipantDisplay.svelte'

import type { RoundStatus } from '$lib/types/backend'

const makeRound = (overrides: any = {}) => ({
  round_id: 'r1',
  guild_id: 'g1',
  title: 'R1',
  status: 'completed' as RoundStatus,
  participants: [],
  created_by: 'u1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

test('renders initials when no avatar_url and shows DNP for completed', () => {
  const round = makeRound({ participants: [{ user_id: 'u1', username: 'Sam' }], status: 'completed' })
  const { getByText } = render(ParticipantDisplay, { props: { round } })
  expect(getByText('S')).toBeTruthy()
  expect(getByText('DNP')).toBeTruthy()
})

test('renders avatar image when avatar_url present and shows score when present', () => {
  const round = makeRound({ participants: [{ user_id: 'u2', username: 'Dana', avatar_url: 'http://example.com/a.png', score: 12 }], status: 'active' })
  const { container, getByText } = render(ParticipantDisplay, { props: { round } })
  const img = container.querySelector('img')
  expect(img).toBeTruthy()
  expect(getByText('12')).toBeTruthy()
})

test('compact view shows stacked avatars and count', () => {
  const participants = [
    { user_id: 'u1', username: 'A' },
    { user_id: 'u2', username: 'B' },
    { user_id: 'u3', username: 'C' },
    { user_id: 'u4', username: 'D' },
  ]
  const round = makeRound({ participants, status: 'scheduled' })
  const { getByText } = render(ParticipantDisplay, { props: { round, compact: true } })
  expect(getByText('4 players')).toBeTruthy()
})
