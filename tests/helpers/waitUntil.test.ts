import { describe, it, expect } from 'vitest'
import { waitUntil } from './waitUntil'

describe('waitUntil', () => {
  it('returns once the condition holds, however many ticks that takes', async () => {
    let ready = false
    setTimeout(() => { ready = true }, 30)
    await waitUntil(() => ready, { timeoutMs: 2000 })
    expect(ready).toBe(true)
  })

  it('fails with the label once the deadline passes', async () => {
    await expect(waitUntil(() => false, { timeoutMs: 20, label: 'the socket' }))
      .rejects.toThrow('the socket did not happen within 20ms')
  })
})
