/**
 * The "mark imported emails as verified" option is sent on BOTH the dry run
 * and the import, and always explicitly: the backend defaults to verified
 * when the field is absent, so the store must never leave the choice implicit.
 * It is on by default because the organization vouches for the addresses it
 * imports, and it goes back to on with the other options on reset.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
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

const classList = new File(['email,first_name,last_name\na@x.fr,Marie,DUPONT\n'], 'classe.csv', { type: 'text/csv' })

describe('bulkImport store — verify imported emails option', () => {
  let store: ReturnType<typeof useBulkImportStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    importData.mockReset().mockResolvedValue({ ...cleanRun, dry_run: false })
    validateImport.mockReset().mockResolvedValue(cleanRun)
    store = useBulkImportStore()
    store.setUsersFile(classList)
  })

  it('marks imported emails as verified by default', () => {
    expect(store.verifyEmails).toBe(true)
  })

  it('sends the default explicitly on the dry run', async () => {
    await store.validateImport('org-1')

    expect(validateImport).toHaveBeenCalledTimes(1)
    expect(validateImport.mock.calls[0][5]).toBe(true)
  })

  it('sends the unticked choice on the dry run', async () => {
    store.verifyEmails = false

    await store.validateImport('org-1')

    expect(validateImport.mock.calls[0][5]).toBe(false)
  })

  it('sends the same choice on the import', async () => {
    store.verifyEmails = false

    await store.performImport('org-1')

    expect(importData).toHaveBeenCalledTimes(1)
    expect(importData.mock.calls[0][2]).toMatchObject({ dryRun: false, verifyEmails: false })
  })

  it('goes back to verified on reset', () => {
    store.verifyEmails = false

    store.reset()

    expect(store.verifyEmails).toBe(true)
  })
})
