// Run this file in a browser-like environment so axe-core can access `document`/`window`
// @vitest-environment jsdom

import { render } from '@testing-library/svelte'
import { describe, it, expect } from 'vitest'
import axe from 'axe-core'
import RoundCard from '$lib/components/round/RoundCard.svelte'
import { makeRound } from '$lib/test-utils/fixtures'

// Minimal a11y smoke test. The global canvas stub is provided by
// `vitest-setup-client.ts` so this test file stays minimal.

describe('a11y: RoundCard basic', () => {
  it('has no detectable accessibility violations', async () => {
    const { container } = render(RoundCard, { round: makeRound() })
    const results = await axe.run(container)
    expect(results.violations.length).toBe(0)
  })
})
