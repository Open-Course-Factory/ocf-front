/**
 * One rule for how a learner's scenario run reads — paused, or ended — shared
 * by the launcher card and the scenario history. Each page used to carry its
 * own copy, and the copies drifted: the launcher called a non-resumable
 * `provisioning` run ended, the history page did not.
 *
 * Contract under test (src/composables/useScenarioRunLabel.ts):
 *   isPausedRun(run)  — resumable && resume_mode === 'paused'
 *   isEndedRun(run)   — !resumable && status is 'active' or 'provisioning'
 *                       (the row has not caught up with a terminal that is gone)
 *   resumeStep(run)   — completed_steps + 1 when completed_steps is a number,
 *                       null otherwise
 *   useScenarioRunLabel() → (run) => string
 *                       paused: "Paused — resume at step N", or plain "Paused"
 *                       when there is no step; ended: "Previous run ended";
 *                       anything else: '' (the caller shows its own status).
 */

import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import {
  isPausedRun,
  isRebuildRun,
  isEndedRun,
  resumeStep,
  useScenarioRunLabel
} from '../../src/composables/useScenarioRunLabel'

type Label = ReturnType<typeof useScenarioRunLabel>

function labelIn(locale: 'en' | 'fr'): Label {
  let label!: Label
  mount(defineComponent({
    setup() {
      label = useScenarioRunLabel()
      return () => h('div')
    }
  }), {
    global: {
      plugins: [createI18n({
        legacy: false,
        locale,
        fallbackLocale: 'en',
        messages: { en: {}, fr: {} },
        missingWarn: false,
        fallbackWarn: false
      })]
    }
  })
  return label
}

const run = (fields: Record<string, unknown>) => ({ status: 'active', ...fields }) as any

describe('isPausedRun', () => {
  it('is a resumable run whose terminal was stopped with its disk kept', () => {
    expect(isPausedRun(run({ resumable: true, resume_mode: 'paused' }))).toBe(true)
  })

  it('is not a live run', () => {
    expect(isPausedRun(run({ resumable: true, resume_mode: 'live' }))).toBe(false)
  })

  it('is not a run that cannot be resumed, whatever its mode says', () => {
    expect(isPausedRun(run({ resumable: false, resume_mode: 'paused' }))).toBe(false)
    expect(isPausedRun(run({ resume_mode: 'paused' }))).toBe(false)
  })
})

describe('isEndedRun', () => {
  it.each(['active', 'provisioning'])('is a %s run the backend reports as not resumable', (status) => {
    expect(isEndedRun(run({ status, resumable: false }))).toBe(true)
  })

  it('treats a missing verdict as not resumable', () => {
    expect(isEndedRun(run({ status: 'active' }))).toBe(true)
  })

  it('is not a resumable run', () => {
    expect(isEndedRun(run({ status: 'active', resumable: true, resume_mode: 'live' }))).toBe(false)
  })

  it.each(['completed', 'abandoned'])('leaves a %s run to its own status', (status) => {
    expect(isEndedRun(run({ status, resumable: false }))).toBe(false)
  })
})

describe('resumeStep', () => {
  it('is the step after the last completed one', () => {
    expect(resumeStep(run({ completed_steps: 3 }))).toBe(4)
    expect(resumeStep(run({ completed_steps: 0 }))).toBe(1)
  })

  it.each([
    ['missing', undefined],
    ['null', null],
    ['not a number', 'three']
  ])('is null when completed_steps is %s', (_label, completedSteps) => {
    expect(resumeStep(run({ completed_steps: completedSteps }))).toBeNull()
  })
})

describe('useScenarioRunLabel', () => {
  const paused = { resumable: true, resume_mode: 'paused' }

  it('names the step a paused run resumes at', () => {
    expect(labelIn('en')(run({ ...paused, completed_steps: 3 }))).toBe('Paused — resume at step 4')
    expect(labelIn('fr')(run({ ...paused, completed_steps: 3 }))).toBe('En pause — reprendre à l\'étape 4')
  })

  it('says only "Paused" when there is no step to name', () => {
    expect(labelIn('en')(run(paused))).toBe('Paused')
    expect(labelIn('fr')(run(paused))).toBe('En pause')
  })

  it('says an ended run ended', () => {
    expect(labelIn('en')(run({ status: 'provisioning', resumable: false }))).toBe('Previous run ended')
    expect(labelIn('fr')(run({ status: 'active', resumable: false }))).toBe('Session précédente terminée')
  })

  it('has nothing to say about a live, completed or abandoned run', () => {
    const label = labelIn('en')
    expect(label(run({ resumable: true, resume_mode: 'live' }))).toBe('')
    expect(label(run({ status: 'completed', resumable: false }))).toBe('')
    expect(label(run({ status: 'abandoned', resumable: false }))).toBe('')
  })
})

/**
 * A run whose container is gone, but which is not over: ocf-core rebuilds its
 * environment at the step the learner left (`resume_mode: 'rebuild'`). It is
 * resumable, so it is neither paused nor ended, and its label says what
 * became of it — the machine is gone, the progress is kept at step N.
 */
describe('a run to rebuild', () => {
  const rebuild = { resumable: true, resume_mode: 'rebuild' }

  it('is recognised as one', () => {
    expect(isRebuildRun(run(rebuild))).toBe(true)
  })

  it('is not a paused, live or non-resumable run', () => {
    expect(isRebuildRun(run({ resumable: true, resume_mode: 'paused' }))).toBe(false)
    expect(isRebuildRun(run({ resumable: true, resume_mode: 'live' }))).toBe(false)
    expect(isRebuildRun(run({ resumable: false, resume_mode: 'rebuild' }))).toBe(false)
  })

  it('is not paused and not ended: it can be resumed', () => {
    expect(isPausedRun(run(rebuild))).toBe(false)
    expect(isEndedRun(run(rebuild))).toBe(false)
  })

  // A status, not an instruction: the button beside it already says what to
  // do, and "lost" alone reads as "my work is lost" — the progress is kept.
  it('says the environment is lost, the progress kept, and at which step', () => {
    expect(labelIn('en')(run({ ...rebuild, completed_steps: 3 })))
      .toBe('Environment lost — progress kept (step 4)')
    expect(labelIn('fr')(run({ ...rebuild, completed_steps: 3 })))
      .toBe('Environnement perdu — progression conservée (étape 4)')
  })

  it('says the same without a step when there is none to name', () => {
    expect(labelIn('en')(run(rebuild))).toBe('Environment lost — progress kept')
    expect(labelIn('fr')(run(rebuild))).toBe('Environnement perdu — progression conservée')
  })
})
