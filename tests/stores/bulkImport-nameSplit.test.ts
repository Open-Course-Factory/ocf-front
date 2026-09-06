/**
 * The store uploads the users file with explicit first_name / last_name
 * columns, as decided in the preview, on BOTH the dry run and the import —
 * the backend gets no say in how a name is cut any more. A file that already
 * carries those columns goes up untouched, and row overrides die with the
 * file they were made on.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, toRaw } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import type { ImportResponse } from '../../src/services/domain/bulkImport'

const importData = vi.fn()
const validateImport = vi.fn()

vi.mock('../../src/services/domain/bulkImport', () => ({
  bulkImportService: {
    importData: (...args: unknown[]) => importData(...args),
    validateImport: (...args: unknown[]) => validateImport(...args),
  },
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
}))

import { useBulkImportStore } from '../../src/stores/bulkImport'

const cleanRun: ImportResponse = {
  success: true,
  dry_run: true,
  summary: {
    users_created: 1, users_updated: 0, users_skipped: 0,
    groups_created: 0, groups_updated: 0, groups_skipped: 0,
    memberships_created: 0, memberships_skipped: 0,
    total_processed: 1, processing_time: '0s',
  },
  errors: [],
  warnings: [],
}

const classList = new File(['email,name\na@x.fr,Marie DUPONT\nb@x.fr,Jean Marie MARTIN\n'], 'classe.csv', { type: 'text/csv' })

describe('bulkImport store — users file uploaded with split names', () => {
  let store: ReturnType<typeof useBulkImportStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    importData.mockReset().mockResolvedValue({ ...cleanRun, dry_run: false })
    validateImport.mockReset().mockResolvedValue(cleanRun)
    store = useBulkImportStore()
    store.setUsersFile(classList)
  })

  it('uploads first_name and last_name columns on the dry run, last name first by default', async () => {
    await store.validateImport('org-1')

    const uploaded = validateImport.mock.calls[0][1] as File
    expect(uploaded.name).toBe('classe.csv')
    expect(await uploaded.text()).toBe('email,first_name,last_name\na@x.fr,DUPONT,Marie\nb@x.fr,MARTIN,Jean Marie\n')
  })

  it('uploads the same split on the import, with the chosen order and row override', async () => {
    store.setNameSplitPlan({ order: 'first_last', overrides: { 1: { cut: 2, order: 'first_last' } } })

    await store.performImport('org-1')

    const uploaded = importData.mock.calls[0][1] as File
    expect(await uploaded.text()).toBe('email,first_name,last_name\na@x.fr,Marie,DUPONT\nb@x.fr,Jean Marie,MARTIN\n')
  })

  it('uploads a file that already has first_name and last_name as it is', async () => {
    const explicit = new File(['email,first_name,last_name\na@x.fr,Marie,DUPONT\n'], 'users.csv', { type: 'text/csv' })
    store.setUsersFile(explicit)

    await store.validateImport('org-1')

    // The store hands the service Vue's reactive proxy of the File it holds.
    expect(toRaw(validateImport.mock.calls[0][1])).toBe(explicit)
  })

  it('drops row overrides when another users file is chosen, keeping the default order', () => {
    store.setNameSplitPlan({ order: 'first_last', overrides: { 0: { cut: 1, order: 'first_last' } } })

    store.setUsersFile(new File(['email,name\n'], 'other.csv', { type: 'text/csv' }))

    expect(store.nameSplitPlan).toEqual({ order: 'first_last', overrides: {} })
  })

  it('goes back to the default plan on reset', () => {
    store.setNameSplitPlan({ order: 'first_last', overrides: { 0: { cut: 1, order: 'first_last' } } })

    store.reset()

    expect(store.nameSplitPlan).toEqual({ order: 'last_first', overrides: {} })
  })
})
