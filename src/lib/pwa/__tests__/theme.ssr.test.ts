import { describe, it, expect } from 'vitest'

describe('SSR import safety - theme store', () => {
  it('imports theme store without throwing', async () => {
    await expect(import('../../stores/theme')).resolves.toBeTruthy()
  })
})
