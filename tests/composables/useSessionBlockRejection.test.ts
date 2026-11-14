/**
 * useSessionBlockRejection — the learner's side of a session block (#384).
 *
 * Starting, resuming or launching while blocked is refused by ocf-core with
 * 403 { error_message: 'session_start_blocked', scope: 'group'|'org'|'global',
 * reason }. The learner reads who blocked them (the class, the organisation or
 * the platform) and the reason the trainer gave, in their language — never the
 * raw code.
 */

import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { useSessionBlockRejection, isSessionBlockRejection } from '../../src/composables/useSessionBlockRejection'

function runInSetup<T>(fn: () => T, locale: 'en' | 'fr' = 'en'): T {
  let captured!: T
  mount(defineComponent({
    setup() {
      captured = fn()
      return () => h('div')
    }
  }), {
    global: {
      plugins: [createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })]
    }
  })
  return captured
}

function blocked(scope: string, reason = '') {
  return { response: { status: 403, data: { error_message: 'session_start_blocked', scope, reason } } }
}

describe('isSessionBlockRejection', () => {
  it('recognises the block refusal', () => {
    expect(isSessionBlockRejection(blocked('group', 'Exam'))).toBe(true)
  })

  it('leaves other refusals alone', () => {
    expect(isSessionBlockRejection({ response: { status: 403, data: { error_message: 'Usage limit exceeded', source: 'organization' } } })).toBe(false)
    expect(isSessionBlockRejection({ response: { status: 402, data: { source: 'dunning' } } })).toBe(false)
    expect(isSessionBlockRejection(new Error('network'))).toBe(false)
    expect(isSessionBlockRejection(undefined)).toBe(false)
  })
})

describe('getSessionBlockMessage', () => {
  it.each([
    ['group', /class/i],
    ['org', /organi[sz]ation/i],
    ['global', /platform/i]
  ])('names the %s scope and gives the reason', (scope, word) => {
    const { getSessionBlockMessage } = runInSetup(() => useSessionBlockRejection())

    const message = getSessionBlockMessage(blocked(scope, 'Exam in progress'))

    expect(message).toMatch(word)
    expect(message).toContain('Exam in progress')
    expect(message).not.toContain('session_start_blocked')
  })

  it('reads well without a reason', () => {
    const { getSessionBlockMessage } = runInSetup(() => useSessionBlockRejection())

    const message = getSessionBlockMessage(blocked('group'))

    expect(message).toMatch(/class/i)
    expect(message).not.toMatch(/undefined|null|:\s*$/)
  })

  it.each([
    ['group', /classe/i],
    ['org', /organisation/i],
    ['global', /plateforme/i]
  ])('speaks French for the %s scope', (scope, word) => {
    const { getSessionBlockMessage } = runInSetup(() => useSessionBlockRejection(), 'fr')

    expect(getSessionBlockMessage(blocked(scope, 'Examen'))).toMatch(word)
  })

  it.each(['group', 'org', 'global'])('words the French %s refusal without gendered forms', (scope) => {
    const { getSessionBlockMessage } = runInSetup(() => useSessionBlockRejection(), 'fr')

    expect(getSessionBlockMessage(blocked(scope, 'Examen'))).not.toMatch(/Bloqué |débloqué|Votre formateur/)
  })

  it.each(['a {b} c', '{reason}'])('shows the reason %s literally, never re-interpolated', (reason) => {
    for (const locale of ['en', 'fr'] as const) {
      const { getSessionBlockMessage } = runInSetup(() => useSessionBlockRejection(), locale)

      expect(getSessionBlockMessage(blocked('group', reason))).toContain(reason)
    }
  })
})
