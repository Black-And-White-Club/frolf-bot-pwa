import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { announcer, announce } from '../announcer'

describe('announcer store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('announces and clears after timeout', () => {
    const values: Array<string | null> = []
    const unsub = announcer.subscribe(v => values.push(v))

    announce('hello world')
    // first tick should set value
    expect(values[values.length - 1]).toBe('hello world')

    // advance timers to clear announcement
    vi.advanceTimersByTime(800)
    expect(values[values.length - 1]).toBe(null)

    unsub()
  })
})
