/**
 * useApiErrorCode reads ocf-core's errors.Abort shape — an HTTP status in
 * error_code, the stable code in error_message — for every coded-error
 * composable. Pinned through its two callers, which differ only in what an
 * unknown failure shows: the admin pages keep the backend's own sentence,
 * the AI assistant never shows raw text.
 */
import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { useAdminUserError } from '../../src/composables/useAdminUserError'
import { useAiAssistantError } from '../../src/composables/useAiAssistantError'

function runInSetup<T>(fn: () => T, locale: 'en' | 'fr' = 'en'): T {
  let captured!: T
  const Dummy = defineComponent({
    setup() {
      captured = fn()
      return () => h('div')
    }
  })
  mount(Dummy, {
    global: {
      plugins: [createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false })]
    }
  })
  return captured
}

const aborted = (status: number, code: string) => ({ response: { status, data: { error_code: status, error_message: code } } })

describe('useApiErrorCode', () => {
  it('translates a known code for the admin pages and keeps an unknown sentence as written', () => {
    const describeError = runInSetup(() => useAdminUserError(), 'fr')
    expect(describeError(aborted(404, 'user_not_found'), 'fallback')).toBe('Cet utilisateur n’existe plus.')
    expect(describeError(aborted(400, 'Cannot delete a user who owns organizations'), 'fallback'))
      .toBe('Cannot delete a user who owns organizations')
    expect(describeError({}, 'fallback')).toBe('fallback')
  })

  it('translates a known code for the AI assistant and falls back for anything else', () => {
    const { aiAssistantErrorMessage } = runInSetup(() => useAiAssistantError())
    expect(aiAssistantErrorMessage(aborted(400, 'ai_key_required'), 'generic')).toContain('enter the API key again')
    expect(aiAssistantErrorMessage(aborted(500, 'dial tcp: connection refused'), 'generic')).toBe('generic')
  })
})
