/**
 * No server chosen means "Automatic": ocf-core then places the session on the
 * least loaded allowed server. The store therefore never picks one on the
 * user's behalf; it only keeps a choice the user made while it stays valid.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const getBackends = vi.fn()
vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: { getBackends: (...args: unknown[]) => getBackends(...args) },
}))

import { useTerminalBackendsStore } from '../../src/stores/terminalBackends'

const two = [
  { id: 'main', name: 'Main', connected: true, is_default: true },
  { id: 'spare', name: 'Spare', connected: true, is_default: false },
]

describe('terminalBackends store — automatic placement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getBackends.mockReset()
  })

  it('selects nothing on load, even with a default server', async () => {
    getBackends.mockResolvedValue(two)
    const store = useTerminalBackendsStore()
    await store.fetchBackends('org-1')
    expect(store.selectedBackendId).toBeNull()
  })

  it('keeps a server the user chose while it is still offered and online', async () => {
    getBackends.mockResolvedValue(two)
    const store = useTerminalBackendsStore()
    store.selectBackend('spare')
    await store.fetchBackends('org-1')
    expect(store.selectedBackendId).toBe('spare')
  })

  it('falls back to automatic when the chosen server is gone or offline', async () => {
    const store = useTerminalBackendsStore()
    store.selectBackend('spare')
    getBackends.mockResolvedValue([two[0], { ...two[1], connected: false }])
    await store.fetchBackends('org-1')
    expect(store.selectedBackendId).toBeNull()
  })
})
