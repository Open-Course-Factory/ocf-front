/**
 * Tests for useComposeErrorMessage — translates the English compose-session
 * error wrapper emitted by ocf-core (`Failed to start composed session: ...
 * (status=N, name=X)`). The composable mirrors the structured marker into
 * a localized message; unknown names fall back to null so callers can
 * preserve the raw text.
 */

import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import {
  useComposeErrorMessage,
  COMPOSE_ERROR_MARKER
} from '../../src/composables/useComposeErrorMessage'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false
  })
}

/**
 * Run the composable inside a fake setup() so it can access useI18n().
 */
function runInSetup<T>(fn: () => T, locale: 'en' | 'fr' = 'en'): T {
  let captured!: T
  const Dummy = defineComponent({
    setup() {
      captured = fn()
      return () => h('div')
    }
  })
  mount(Dummy, { global: { plugins: [createTestI18n(locale)] } })
  return captured
}

describe('useComposeErrorMessage', () => {
  describe('COMPOSE_ERROR_MARKER', () => {
    it('matches the wrapper produced by ocf-core FormatError', () => {
      const raw = 'Failed to start composed session: An unknown error occurred during creation (status=5, name=unknown_error)'
      const m = COMPOSE_ERROR_MARKER.exec(raw)
      expect(m).not.toBeNull()
      expect(m![1]).toBe('5')
      expect(m![2]).toBe('unknown_error')
    })

    it('does not match unrelated strings', () => {
      expect(COMPOSE_ERROR_MARKER.exec('something went wrong')).toBeNull()
      expect(COMPOSE_ERROR_MARKER.exec('status=5 name=unknown_error')).toBeNull()
    })
  })

  describe('getComposeErrorMessage (en)', () => {
    it('translates unknown_error to the English message', () => {
      const { getComposeErrorMessage } = runInSetup(() => useComposeErrorMessage())
      const out = getComposeErrorMessage(
        'Failed to start composed session: An unknown error occurred during creation (status=5, name=unknown_error)'
      )
      expect(out).toContain('unexpected error')
    })

    it('translates quota_reached', () => {
      const { getComposeErrorMessage } = runInSetup(() => useComposeErrorMessage())
      const out = getComposeErrorMessage(
        'Failed to start composed session: quota reached (status=3, name=quota_reached)'
      )
      expect(out).toContain('quota')
    })

    it('returns null when the marker is absent', () => {
      const { getComposeErrorMessage } = runInSetup(() => useComposeErrorMessage())
      expect(getComposeErrorMessage('Generic server error')).toBeNull()
    })

    it('returns null for an empty / nullish input', () => {
      const { getComposeErrorMessage } = runInSetup(() => useComposeErrorMessage())
      expect(getComposeErrorMessage(null)).toBeNull()
      expect(getComposeErrorMessage(undefined)).toBeNull()
      expect(getComposeErrorMessage('')).toBeNull()
    })

    it('returns null when name has no translation entry (future enum value)', () => {
      const { getComposeErrorMessage } = runInSetup(() => useComposeErrorMessage())
      const out = getComposeErrorMessage(
        'Failed to start composed session: brand new failure (status=99, name=brand_new_failure)'
      )
      expect(out).toBeNull()
    })
  })

  describe('getComposeErrorMessage (fr)', () => {
    it('returns the French message when locale is fr', () => {
      const { getComposeErrorMessage } = runInSetup(() => useComposeErrorMessage(), 'fr')
      const out = getComposeErrorMessage(
        'Failed to start composed session: An unknown error occurred during creation (status=5, name=unknown_error)'
      )
      expect(out).toMatch(/erreur|contactez/i)
      // Sanity: should NOT contain English fallback
      expect(out).not.toMatch(/unexpected error occurred/i)
    })
  })
})
