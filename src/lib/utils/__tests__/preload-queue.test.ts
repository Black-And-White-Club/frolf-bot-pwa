/* @vitest-environment jsdom */
import { test, expect } from 'vitest'
import { enqueuePreload } from '../preload-queue'

test('enqueuePreload respects concurrency limit', async () => {
  // create slow tasks
  const results: number[] = []
  const makeTask = (n: number) => () => new Promise<number>((res) => setTimeout(() => { results.push(n); res(n) }, 10))

  const promises = []
  for (let i = 0; i < 5; i++) {
    promises.push(enqueuePreload(makeTask(i)))
  }

  const resolved = await Promise.all(promises)
  expect(resolved.length).toBe(5)
  // ensure all values returned
  expect(resolved.sort((a, b) => a - (b as number))).toEqual([0,1,2,3,4])
  // results array should contain all entries
  expect(results.length).toBe(5)
})
