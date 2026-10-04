/**
 * The problems a refused scenario import lists. ocf-core answers content it
 * cannot play with a 400 whose `details` names every problem, step and field
 * (respondImportError); anything else has no list and yields [].
 */
export function scenarioImportProblems(err: any): string[] {
  const details = err?.response?.status === 400 ? err.response.data?.details : undefined
  return Array.isArray(details) ? details.filter((d: unknown): d is string => typeof d === 'string') : []
}
