/*
 * Open Course Factory - Front
 * Copyright (C) 2023-2026 Solution Libre
 *
 * Builds the update payload for a scenario step, dropping script fields the
 * editor was never shown.
 */

/**
 * Fields `scenarioStepRedactor` strips from a step read unless the caller can
 * manage the scenario. The editor reads through that same endpoint, so it can
 * be handed an empty box for a script that exists on the server.
 *
 * The editor cannot tell the two cases apart: every one of these is tagged
 * `omitempty` on `ScenarioStepOutput`, so a redacted field and a genuinely
 * empty one arrive identically — both absent from the JSON. Do not try to
 * infer which it was.
 *
 * What the editor does know is whether the read delivered the field at all,
 * and that turns out to be enough, because omitting is the correct action in
 * both cases: it preserves a hidden script, and it leaves an empty one empty.
 */
export const REDACTABLE_STEP_FIELDS = [
  'verify_script',
  'background_script',
  'foreground_script',
  'hint_content',
  'flag_path'
] as const

/**
 * Records which redactable fields a step read actually delivered. Presence is
 * the signal — not truthiness — so a field that legitimately came back empty
 * is still counted as received.
 */
export function receivedScriptFields(readResponse: Record<string, any> | null | undefined): string[] {
  if (!readResponse) return []
  return REDACTABLE_STEP_FIELDS.filter(
    field => readResponse[field] !== undefined && readResponse[field] !== null
  )
}

/**
 * Drops script fields the read never delivered AND the user never filled in.
 *
 * A field that arrived, or that now holds content, is always sent — so
 * deliberately clearing a script the user could actually see still works, and
 * writing into a field that was previously empty still works.
 *
 * This matters because ocf-core guards its update on `!= nil`, and `""` is not
 * nil: sending an empty string for a never-seen script overwrites it with
 * nothing, silently, on a save the user thought was harmless.
 */
export function withoutUnseenScripts(
  stepData: Record<string, any>,
  receivedFields: readonly string[] = []
): Record<string, any> {
  const payload = { ...stepData }

  for (const field of REDACTABLE_STEP_FIELDS) {
    if (!receivedFields.includes(field) && !payload[field]) {
      delete payload[field]
    }
  }

  return payload
}
