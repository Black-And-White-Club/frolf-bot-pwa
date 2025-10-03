/* @vitest-environment jsdom */

/* @vitest-environment jsdom */
import { render, cleanup } from '@testing-library/svelte'
import Leaderboard from '../Leaderboard.svelte'
import type { LeaderboardEntry } from '$lib/types/backend'
import { test, expect } from 'vitest'

test('shows empty state when no entries', () => {
  const { getByText } = render(Leaderboard, { props: { entries: [] } })
  getByText('No players yet.')
})

test('renders entries and respects limit and compact props', () => {
  const entries: LeaderboardEntry[] = [
    { tag_number: 1, user_id: 'u1' },
    { tag_number: 2, user_id: 'u2' },
    { tag_number: 3, user_id: 'u3' },
  ]

  const { getByTestId, queryByTestId } = render(Leaderboard, { props: { entries, limit: 2 } })

  // should render only first two rows
  expect(getByTestId('leaderboard-row-u1')).toBeTruthy()
  expect(getByTestId('leaderboard-row-u2')).toBeTruthy()
  expect(queryByTestId('leaderboard-row-u3')).toBeNull()

  // compact mode still renders rows — cleanup previous render to avoid duplicate nodes
  cleanup()
  const { getByTestId: getByTestId2 } = render(Leaderboard, { props: { entries, compact: true } })
  // compact view should render all three entries
  expect(getByTestId2('leaderboard-row-u1')).toBeTruthy()
  expect(getByTestId2('leaderboard-row-u2')).toBeTruthy()
  expect(getByTestId2('leaderboard-row-u3')).toBeTruthy()
})
