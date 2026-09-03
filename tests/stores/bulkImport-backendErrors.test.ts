/**
 * The backend's import errors must reach the user word for word.
 *
 * When the users file cannot be parsed (a header without the expected columns,
 * say), the backend answers 400 with the SAME ImportResponse it uses for a
 * successful dry run: `errors[{row, file, field, message, code}]`. Axios turns
 * a 400 into a rejection, and the store used to read only `error_message`
 * from the body, so the per-row messages were dropped and the page showed a
 * generic "validation failed". Validation errors that DID arrive as a 200 were
 * lost too: the store moved to the `error` step, which renders the import
 * result panel with no results, so the user saw "an unexpected error occurred".
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import type { ImportResponse } from '../../src/services/domain/bulkImport'

const importData = vi.fn()

vi.mock('../../src/services/domain/bulkImport', () => ({
  bulkImportService: {
    importData: (...args: unknown[]) => importData(...args),
    validateImport: (...args: unknown[]) => importData(...args),
  },
}))

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
}))

import { useBulkImportStore } from '../../src/stores/bulkImport'

const emptySummary = {
  users_created: 0, users_updated: 0, users_skipped: 0,
  groups_created: 0, groups_updated: 0, groups_skipped: 0,
  memberships_created: 0, memberships_skipped: 0,
  total_processed: 0, processing_time: '0s',
}

const headerError = {
  row: 1,
  file: 'users',
  field: 'email',
  message: "missing required column 'email'; found: Nom, Né(e) le, Sexe, E-mail; accepted: email, e-mail, mail",
  code: 'VALIDATION_ERROR',
}

const rejectedImport: ImportResponse = {
  success: false,
  dry_run: true,
  summary: emptySummary,
  errors: [headerError],
  warnings: [],
}

function http400(data: unknown) {
  return Object.assign(new Error('Request failed with status code 400'), {
    response: { status: 400, data },
  })
}

describe('bulkImport store — backend errors reach the user verbatim', () => {
  let store: ReturnType<typeof useBulkImportStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    importData.mockReset()
    store = useBulkImportStore()
    store.setUsersFile(new File(['Nom;E-mail\n'], 'classe.csv', { type: 'text/csv' }))
  })

  it('keeps the per-row errors of a 400 validation answer', async () => {
    importData.mockRejectedValue(http400(rejectedImport))

    const ok = await store.validateImport('org-1')

    expect(ok).toBe(false)
    expect(store.validationResults?.errors).toEqual([headerError])
  })

  it('shows validation errors on the validation results step, not the import panel', async () => {
    importData.mockResolvedValue(rejectedImport)

    await store.validateImport('org-1')

    expect(store.step).toBe('validation-results')
    expect(store.validationResults?.errors[0].message).toBe(headerError.message)
  })

  it('keeps the per-row errors of a 400 import answer', async () => {
    importData.mockRejectedValue(http400({ ...rejectedImport, dry_run: false }))

    const ok = await store.performImport('org-1')

    expect(ok).toBe(false)
    expect(store.step).toBe('error')
    expect(store.importResults?.errors).toEqual([headerError])
  })

  it('still reports a body without per-row errors as one system error', async () => {
    importData.mockRejectedValue(http400({ error_code: 400, error_message: 'Users file is required' }))

    await store.validateImport('org-1')

    expect(store.validationResults?.errors).toEqual([
      { row: 0, file: 'system', message: 'Users file is required', code: 'NETWORK_ERROR' },
    ])
    expect(store.step).toBe('validation-results')
  })
})
