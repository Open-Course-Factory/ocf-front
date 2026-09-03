import type { ImportError, ImportResponse } from './bulkImport'

const emptySummary: ImportResponse['summary'] = {
  users_created: 0,
  users_updated: 0,
  users_skipped: 0,
  groups_created: 0,
  groups_updated: 0,
  groups_skipped: 0,
  memberships_created: 0,
  memberships_skipped: 0,
  total_processed: 0,
  processing_time: '0s'
}

interface HttpFailure {
  response?: { data?: Partial<ImportResponse> & { error_message?: string; message?: string } }
}

function hasRowErrors(data: unknown): data is ImportResponse {
  const errors = (data as Partial<ImportResponse> | undefined)?.errors
  return Array.isArray(errors) && errors.length > 0
}

/**
 * Turns a rejected import request into the response the result panels render.
 *
 * The backend answers a rejected file with HTTP 400 and the SAME body as a
 * successful dry run — per-row `errors` with row, file, field and message —
 * so those are kept verbatim. Any other failure (a plain API error, a network
 * fault) becomes one system-level error carrying the backend's message when
 * it sent one, else the given fallback.
 */
export function importResponseFromError(err: unknown, fallbackMessage: string): ImportResponse {
  const data = (err as HttpFailure).response?.data
  if (hasRowErrors(data)) {
    return { ...data, warnings: data.warnings ?? [] }
  }

  const systemError: ImportError = {
    row: 0,
    file: 'system',
    message: data?.error_message || data?.message || fallbackMessage,
    code: 'NETWORK_ERROR'
  }
  return { success: false, dry_run: false, summary: emptySummary, errors: [systemError], warnings: [] }
}
