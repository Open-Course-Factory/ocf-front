/**
 * A help article about a feature behind a platform switch is listed only
 * while the switch is on, as a whole section behind one is.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const enabled = new Set<string>()
vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ isEnabled: (flag: string) => enabled.has(flag) })
}))

import { useHelpRegistryStore } from '../../src/stores/helpRegistry'

const text = { en: 'x', fr: 'x' }

describe('help registry — articles behind a switch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    enabled.clear()
    useHelpRegistryStore().registerSection({
      id: 's', title: text, description: text, icon: '',
      items: [
        { route: 's/always', title: text, description: text, icon: '' },
        { route: 's/switched', title: text, description: text, icon: '', featureFlag: 'local_machines' }
      ]
    })
  })

  it('leaves the article out while its switch is off', () => {
    expect(useHelpRegistryStore().filteredSections[0].items.map(i => i.route)).toEqual(['s/always'])
  })

  it('lists it once the switch is on', () => {
    enabled.add('local_machines')
    expect(useHelpRegistryStore().filteredSections[0].items.map(i => i.route)).toEqual(['s/always', 's/switched'])
  })
})
