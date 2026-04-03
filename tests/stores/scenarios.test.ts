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

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

// Mock projectFiles store used as parent entity
vi.mock('../../src/stores/projectFiles', () => ({
  useProjectFilesStore: vi.fn(() => ({
    entities: [],
    fieldList: new Map(),
    isLoading: ref(false),
    error: ref(''),
    loadAll: vi.fn()
  }))
}))

import { useScenariosStore } from '../../src/stores/scenarios'

describe('scenarios store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fieldList', () => {
    it('is a computed property returning a Map', () => {
      const store = useScenariosStore()

      // fieldList is a computed returning a Map
      const fields = store.fieldList
      expect(fields).toBeDefined()
      expect(fields).toBeInstanceOf(Map)
      expect(fields.size).toBeGreaterThan(0)
    })

    it('contains required fields', () => {
      const store = useScenariosStore()
      const fields = store.fieldList

      expect(fields.has('id')).toBe(true)
      expect(fields.has('name')).toBe(true)
      expect(fields.has('title')).toBe(true)
      expect(fields.has('description')).toBe(true)
      expect(fields.has('difficulty')).toBe(true)
      expect(fields.has('estimated_time')).toBe(true)
      expect(fields.has('os_type')).toBe(true)
      expect(fields.has('instance_type')).toBe(true)
      expect(fields.has('source_type')).toBe(true)
      expect(fields.has('git_repository')).toBe(true)
      expect(fields.has('git_branch')).toBe(true)
      expect(fields.has('is_public')).toBe(true)
      expect(fields.has('flags_enabled')).toBe(true)
      expect(fields.has('gsh_enabled')).toBe(true)
      expect(fields.has('crash_traps')).toBe(true)
      expect(fields.has('hostname')).toBe(true)
    })

    it('difficulty field has select options', () => {
      const store = useScenariosStore()
      const difficultyField = store.fieldList.get('difficulty')

      expect(difficultyField).toBeDefined()
      expect(difficultyField!.type).toBe('select')
      expect(difficultyField!.options).toBeDefined()
      expect(difficultyField!.options.length).toBe(3)

      const optionValues = difficultyField!.options.map((o: any) => o.value)
      expect(optionValues).toContain('beginner')
      expect(optionValues).toContain('intermediate')
      expect(optionValues).toContain('advanced')
    })

    it('os_type field has select options', () => {
      const store = useScenariosStore()
      const osField = store.fieldList.get('os_type')

      expect(osField).toBeDefined()
      expect(osField!.type).toBe('select')

      const optionValues = osField!.options.map((o: any) => o.value)
      expect(optionValues).toContain('deb')
      expect(optionValues).toContain('rpm')
      expect(optionValues).toContain('apk')
      expect(optionValues).toContain('pacman')
    })

    it('source_type field has select options', () => {
      const store = useScenariosStore()
      const sourceField = store.fieldList.get('source_type')

      expect(sourceField).toBeDefined()
      expect(sourceField!.type).toBe('select')

      const optionValues = sourceField!.options.map((o: any) => o.value)
      expect(optionValues).toContain('git')
      expect(optionValues).toContain('upload')
      expect(optionValues).toContain('builtin')
      expect(optionValues).toContain('seed')
    })

    it('name field is required and creatable', () => {
      const store = useScenariosStore()
      const nameField = store.fieldList.get('name')

      expect(nameField).toBeDefined()
      expect(nameField!.required).toBe(true)
      expect(nameField!.toBeSet).toBe(true)
    })

    it('id field is hidden and readonly', () => {
      const store = useScenariosStore()
      const idField = store.fieldList.get('id')

      expect(idField).toBeDefined()
      expect(idField!.display).toBe(false)
      expect(idField!.toBeSet).toBe(false)
      expect(idField!.toBeEdited).toBe(false)
    })

    it('parent entity fields are multi-select type', () => {
      const store = useScenariosStore()

      const setupScript = store.fieldList.get('setup_script_id')
      const introFile = store.fieldList.get('intro_file_id')
      const finishFile = store.fieldList.get('finish_file_id')

      expect(setupScript?.type).toBe('multi-select')
      expect(introFile?.type).toBe('multi-select')
      expect(finishFile?.type).toBe('multi-select')
    })

    it('instance_type field is a searchable-select', () => {
      const store = useScenariosStore()
      const instanceField = store.fieldList.get('instance_type')

      expect(instanceField).toBeDefined()
      expect(instanceField!.type).toBe('searchable-select')
      expect(instanceField!.required).toBe(true)
      expect(instanceField!.optionsLoader).toBeDefined()
    })

    it('checkbox fields are properly configured', () => {
      const store = useScenariosStore()

      const boolFields = ['is_public', 'flags_enabled', 'gsh_enabled', 'crash_traps']
      for (const fieldName of boolFields) {
        const f = store.fieldList.get(fieldName)
        expect(f).toBeDefined()
        expect(f!.type).toBe('checkbox')
        expect(f!.toBeSet).toBe(true) // creatable
        expect(f!.toBeEdited).toBe(true) // updatable
      }
    })
  })

  describe('parent entity stores', () => {
    it('registers projectFilesStore for setup_script_id, intro_file_id, finish_file_id', () => {
      const store = useScenariosStore()

      expect(store.parentEntitiesStores).toBeDefined()
      expect(store.parentEntitiesStores.has('setup_script_id')).toBe(true)
      expect(store.parentEntitiesStores.has('intro_file_id')).toBe(true)
      expect(store.parentEntitiesStores.has('finish_file_id')).toBe(true)
    })
  })

  describe('base store integration', () => {
    it('exposes base store entities array', () => {
      const store = useScenariosStore()

      expect(store.entities).toBeDefined()
      expect(Array.isArray(store.entities)).toBe(true)
    })
  })
})
