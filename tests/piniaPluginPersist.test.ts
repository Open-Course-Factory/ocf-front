/**
 * The persistence plugin saves every store's whole state to localStorage and
 * restores it at boot. That is right for preferences and wrong for anything the
 * backend decides: a restored verdict looks "loaded", so it is never re-asked,
 * and localStorage outlives the session — a snapshot taken under one account
 * was served to the next one signing in on the same browser.
 *
 * A store declares `persist: false` to stay out of it, and logout clears every
 * persisted store so nothing crosses accounts.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { createApp, nextTick, ref } from 'vue'
import { piniaPluginPersist, clearPersistedStores } from '../src/piniaPluginPersist'

// Pinia queues plugins until it is installed in an app, so a bare createPinia()
// would never run the plugin and every assertion below would pass vacuously.
function freshPinia() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersist)
  createApp({}).use(pinia)
  setActivePinia(pinia)
  return pinia
}

describe('piniaPluginPersist', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores and writes a store that does not opt out', async () => {
    localStorage.setItem('pinia_state_prefs', JSON.stringify({ theme: 'dark' }))
    freshPinia()
    const usePrefs = defineStore('prefs', () => ({ theme: ref('light') }))

    const prefs = usePrefs()
    expect(prefs.theme).toBe('dark')

    prefs.theme = 'sepia'
    await nextTick()
    expect(JSON.parse(localStorage.getItem('pinia_state_prefs') || '{}').theme).toBe('sepia')
  })

  it('neither restores nor writes a store that declares persist: false', async () => {
    localStorage.setItem('pinia_state_verdicts', JSON.stringify({ allowed: true }))
    freshPinia()
    const useVerdicts = defineStore('verdicts', () => ({ allowed: ref(false) }), { persist: false })

    const verdicts = useVerdicts()
    expect(verdicts.allowed).toBe(false)

    verdicts.allowed = true
    await nextTick()
    expect(JSON.parse(localStorage.getItem('pinia_state_verdicts') || '{}').allowed).toBe(true)
    // ...still the stale value someone else left: the plugin never wrote it.
    expect(localStorage.getItem('pinia_state_verdicts')).toBe(JSON.stringify({ allowed: true }))
  })

  it('clearPersistedStores removes every persisted store and nothing else', () => {
    localStorage.setItem('pinia_state_prefs', '{}')
    localStorage.setItem('pinia_state_organizations', '{}')
    localStorage.setItem('terminal-recording-acknowledged', '1')

    clearPersistedStores()

    expect(localStorage.getItem('pinia_state_prefs')).toBeNull()
    expect(localStorage.getItem('pinia_state_organizations')).toBeNull()
    expect(localStorage.getItem('terminal-recording-acknowledged')).toBe('1')
  })
})
