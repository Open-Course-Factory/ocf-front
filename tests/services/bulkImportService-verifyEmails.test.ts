/**
 * The `verify_emails` multipart field is ALWAYS present on the import request.
 * The backend treats an absent field as "verified", so an older front keeps
 * working, but the current front must state the checkbox's value every time —
 * an omitted "false" would silently verify addresses the teacher chose to let
 * learners confirm themselves.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockPost = vi.fn()
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: (...a: any[]) => mockPost(...a),
    patch: vi.fn(),
  },
}))

import { bulkImportService } from '../../src/services/domain/bulkImport'

const usersFile = new File(['email,first_name,last_name\na@x.fr,Marie,DUPONT\n'], 'users.csv', { type: 'text/csv' })

function sentFormData(): FormData {
  return mockPost.mock.calls[0][1] as FormData
}

beforeEach(() => {
  mockPost.mockReset()
  mockPost.mockResolvedValue({ data: { success: true, dry_run: false, summary: {}, errors: [], warnings: [] } })
})

describe('bulkImportService — verify_emails field', () => {
  it('sends verify_emails=true when the option is not given', async () => {
    await bulkImportService.importData('org-1', usersFile)

    expect(sentFormData().get('verify_emails')).toBe('true')
  })

  it('sends verify_emails=false when the option is unticked', async () => {
    await bulkImportService.importData('org-1', usersFile, { verifyEmails: false })

    expect(sentFormData().get('verify_emails')).toBe('false')
  })

  it('sends the same field on the dry run', async () => {
    await bulkImportService.validateImport('org-1', usersFile, undefined, undefined, undefined, false)

    const formData = sentFormData()
    expect(formData.get('dry_run')).toBe('true')
    expect(formData.get('verify_emails')).toBe('false')
  })
})
