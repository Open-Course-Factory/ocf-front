import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// Mocks MUST be defined BEFORE imports
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

vi.mock('../../src/services/core/error', () => ({
  handleStoreError: vi.fn((err: any, fallbackKey: string) => fallbackKey)
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

const localMachinesFlag = ref(false)
vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ createReactiveFlag: () => localMachinesFlag })
}))

import axios from 'axios'
import { useScenariosStore } from '../../src/stores/scenarios'

describe('scenarios store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fieldList', () => {
    // What the admin scenario form is built from.
    it('exposes the fields the scenario form needs', () => {
      const fields = useScenariosStore().fieldList
      const expected = [
        'id', 'name', 'title', 'description', 'difficulty', 'estimated_time_minutes', 'os_type',
        'instance_type', 'source_type', 'git_repository', 'git_branch', 'is_public',
        'flags_enabled', 'crash_traps', 'hostname'
      ]
      expect(expected.filter(name => !fields.has(name))).toEqual([])
    })

    it.each([
      ['difficulty', ['beginner', 'intermediate', 'advanced']],
      ['os_type', ['deb', 'rpm', 'apk', 'pacman']],
      ['source_type', ['git', 'upload', 'builtin', 'seed']]
    ])('offers the %s choices the backend accepts', (name, values) => {
      const field = useScenariosStore().fieldList.get(name)!
      expect(field.type).toBe('select')
      expect(field.options.map((o: any) => o.value)).toEqual(values)
    })

    it.each([
      ['name', { required: true, toBeSet: true }],
      ['id', { display: false, toBeSet: false, toBeEdited: false }],
      ['instance_type', { type: 'searchable-select', required: true }],
      ['is_public', { type: 'checkbox', toBeSet: true, toBeEdited: true }],
      ['flags_enabled', { type: 'checkbox', toBeSet: true, toBeEdited: true }],
      ['crash_traps', { type: 'checkbox', toBeSet: true, toBeEdited: true }]
    ])('configures %s as the form expects', (name, config) => {
      expect(useScenariosStore().fieldList.get(name)).toMatchObject(config)
    })

    // Machines in the browser are switched off on most platforms: no
    // column, no field, for a choice nobody there has.
    it('offers where a scenario runs only while machines in the browser are switched on', () => {
      localMachinesFlag.value = false
      expect(useScenariosStore().fieldList.has('machine')).toBe(false)
      setActivePinia(createPinia())
      localMachinesFlag.value = true
      expect(useScenariosStore().fieldList.get('machine')!.options.map((o: any) => o.value)).toEqual(['incus', 'local', 'by_account'])
      localMachinesFlag.value = false
    })

    // The backend still persists gsh_enabled so existing archives round-trip,
    // but nothing consumes it: the editor must not offer it.
    it('does not expose the dropped gsh_enabled flag', () => {
      const store = useScenariosStore()

      expect(store.fieldList.has('gsh_enabled')).toBe(false)
    })
  })

  describe('loadActiveEntities', () => {
    const page = (ids: string[], totalPages: number) =>
      ({ data: { data: ids.map(id => ({ id })), totalPages } })

    // The editor lists only scenarios still in use — even when the admin
    // list's toggle, which lives on this same store, is showing archived ones.
    it('leaves archived rows out with their steps and restores the toggle', async () => {
      const store = useScenariosStore()
      ;(axios.get as any).mockResolvedValue(page([], 1))
      store.includeArchived = true

      await store.loadActiveEntities()

      const params = new URL((axios.get as any).mock.calls[0][0], 'http://x').searchParams
      expect(params.has('include_archived')).toBe(false)
      expect(params.get('include')).toBe('steps')
      expect(store.includeArchived).toBe(true)
    })

    // A single GET stops at the backend's default page of 20: an author with
    // more scenarios could not open the rest from the editor.
    it('keeps every scenario when the list spans several pages', async () => {
      const store = useScenariosStore()
      ;(axios.get as any)
        .mockResolvedValueOnce(page(['a', 'b'], 2))
        .mockResolvedValueOnce(page(['c'], 2))

      await store.loadActiveEntities()

      expect(store.entities.map((s: any) => s.id)).toEqual(['a', 'b', 'c'])
      const pages = (axios.get as any).mock.calls.map(([url]: [string]) =>
        new URL(url, 'http://x').searchParams.get('page'))
      expect(pages).toEqual(['1', '2'])
    })

    it('replaces the previous list rather than appending to it', async () => {
      const store = useScenariosStore()
      ;(axios.get as any).mockResolvedValue(page(['a'], 1))
      await store.loadActiveEntities()
      ;(axios.get as any).mockResolvedValue(page(['b'], 1))
      await store.loadActiveEntities()

      expect(store.entities.map((s: any) => s.id)).toEqual(['b'])
    })
  })
})
