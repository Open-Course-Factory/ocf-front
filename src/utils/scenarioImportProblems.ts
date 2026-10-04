/**
 * The problems a refused scenario import lists. ocf-core answers content it
 * cannot play with a 400 whose `details` names every problem, step and field
 * (respondImportError); anything else has no list and yields [].
 */
export function scenarioImportProblems(err: any): string[] {
  const details = err?.response?.status === 400 ? err.response.data?.details : undefined
  return Array.isArray(details) ? details.filter((d: unknown): d is string => typeof d === 'string') : []
}

/**
 * The one sentence a failed scenario import shows when it lists no problems.
 * A 413 is the server (or a proxy before it) refusing the body's size — not
 * the client's own file limit, which the modals check before sending — and
 * comes with no JSON body to read, so it gets its own sentence. Anything else
 * says what the server said, or the caller's fallback.
 */
export function scenarioImportError(err: any, text: { tooLarge: string; fallback: string }): string {
  if (err?.response?.status === 413) return text.tooLarge
  return err?.response?.data?.error_message || err?.response?.data?.message || text.fallback
}
