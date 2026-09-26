/**
 * The author's preview of a scenario (POST /scenarios/:id/preview): what the
 * editor sends, and which refusals it can explain in the author's language.
 */

/** The preview body. A step order of 0 is a real step and is sent. */
export function previewOptions(organizationId: string | undefined, fromStepOrder: number | null) {
  return {
    organization_id: organizationId,
    from_step_order: fromStepOrder ?? undefined
  }
}

/**
 * The editor's message for a refused preview, or null to show the backend's
 * own explanation.
 *
 * A 403 about the terminal budget is not a matter of rights: the backend's
 * sentence tells the author what to free. A 400 only means "unknown step" when
 * a step was asked for; otherwise it is a malformed request.
 */
export function previewRefusalKey(status: number | undefined, data: any, fromStepOrder: number | null): string | null {
  if (status === 400 && fromStepOrder !== null) return 'scenarioEditor.previewErrorUnknownStep'
  if (status === 403 && data?.source !== 'budget') return 'scenarioEditor.previewErrorForbidden'
  if (status === 409 && data?.reason === 'session_exists') return 'scenarioEditor.previewErrorSessionExists'
  return null
}
