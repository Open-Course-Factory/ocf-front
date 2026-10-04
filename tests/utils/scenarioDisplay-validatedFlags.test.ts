/**
 * When the learner's validated-flags panel shows. ocf-core issues a flag for
 * every flag step regardless of flags_enabled and reports it as
 * has_flag_steps; a backend without that field must behave as before.
 */

import { describe, it, expect } from 'vitest'
import { showsValidatedFlags } from '../../src/utils/scenarioDisplay'
import type { ScenarioInfo } from '../../src/services/domain/scenario'

const scenario = (fields: Partial<ScenarioInfo>): ScenarioInfo => ({ id: 's', name: 's', title: 'S', ...fields })

describe('showsValidatedFlags', () => {
  it('shows for a scenario with a flag step, flags_enabled or not', () => {
    expect(showsValidatedFlags(scenario({ flags_enabled: false, has_flag_steps: true }))).toBe(true)
  })

  it('shows for a flags_enabled scenario', () => {
    expect(showsValidatedFlags(scenario({ flags_enabled: true, has_flag_steps: false }))).toBe(true)
  })

  it('hides for a scenario with neither', () => {
    expect(showsValidatedFlags(scenario({ flags_enabled: false, has_flag_steps: false }))).toBe(false)
  })

  it('falls back to flags_enabled when the backend does not send has_flag_steps', () => {
    expect(showsValidatedFlags(scenario({ flags_enabled: true }))).toBe(true)
    expect(showsValidatedFlags(scenario({ flags_enabled: false }))).toBe(false)
  })

  it('hides before the scenario has loaded', () => {
    expect(showsValidatedFlags(null)).toBe(false)
  })
})
