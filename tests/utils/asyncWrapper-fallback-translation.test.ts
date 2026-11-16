/**
 * Store error fallback keys must be translated.
 *
 * When the backend answers without a message (e.g. a 502 with an HTML or empty
 * body), withAsync stored the raw fallback key (e.g. 'subscriptions.loadError')
 * and pages displayed it as is. Also, the errors.* fallback keys used by
 * baseStore existed in no locale.
 *
 * Uses the REAL errorHandler and the REAL i18n instance (the other
 * asyncWrapper test files mock handleStoreError, hence a separate file).
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import i18n from '../../src/i18n'
import { withAsync } from '../../src/utils/asyncWrapper'
import type { AsyncState } from '../../src/utils/asyncWrapper'
import { useBaseStore } from '../../src/stores/baseStore'

function createState(): AsyncState {
  return { isLoading: ref(false), error: ref('') }
}

// Axios-shaped error as produced by a proxy 502 with an HTML body
function badGateway(data: unknown = '<html><body>502 Bad Gateway</body></html>') {
  return {
    isAxiosError: true,
    message: 'Request failed with status code 502',
    response: { status: 502, data, headers: {}, statusText: 'Bad Gateway', config: {} },
    config: {}
  }
}

describe('withAsync — fallback key is translated (#389)', () => {
  beforeAll(() => {
    i18n.global.mergeLocaleMessage('en', { asyncFallbackTest: { loadError: 'Could not load the thing' } })
    i18n.global.mergeLocaleMessage('fr', { asyncFallbackTest: { loadError: 'Impossible de charger la chose' } })
  })

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it.each([
    ['en', 'Could not load the thing'],
    ['fr', 'Impossible de charger la chose']
  ])('stores the %s translation, not the key, when the backend gives no message', async (locale, expected) => {
    i18n.global.locale.value = locale as 'en' | 'fr'
    const state = createState()

    await withAsync(state, async () => { throw badGateway() }, 'asyncFallbackTest.loadError').catch(() => {})

    expect(state.error.value).toBe(expected)
  })

  it('stores the translation when the request got no answer at all', async () => {
    i18n.global.locale.value = 'fr'
    const state = createState()
    const networkError = { isAxiosError: true, request: {}, message: 'Network Error', config: {} }

    await withAsync(state, async () => { throw networkError }, 'asyncFallbackTest.loadError').catch(() => {})

    expect(state.error.value).toBe('Impossible de charger la chose')
  })

  it('stores the translation when the 502 body is empty', async () => {
    i18n.global.locale.value = 'en'
    const state = createState()

    await withAsync(state, async () => { throw badGateway('') }, 'asyncFallbackTest.loadError').catch(() => {})

    expect(state.error.value).toBe('Could not load the thing')
  })

  it('keeps the backend error_message over the fallback', async () => {
    i18n.global.locale.value = 'en'
    const state = createState()

    await withAsync(
      state,
      async () => { throw badGateway({ error_message: 'Plan limit reached' }) },
      'asyncFallbackTest.loadError'
    ).catch(() => {})

    expect(state.error.value).toBe('Plan limit reached')
  })
})

describe('baseStore errors.* fallback keys exist in every locale (#389)', () => {
  const source = readFileSync(resolve(__dirname, '../../src/stores/baseStore.ts'), 'utf8')
  const keys = [...new Set(source.match(/['"]errors\.[A-Za-z]+['"]/g)?.map(k => k.slice(1, -1)) ?? [])]

  beforeAll(() => {
    useBaseStore() // registers the store's own translations, if any
  })

  it('finds the fallback keys in baseStore', () => {
    expect(keys.length).toBeGreaterThan(0)
  })

  it.each(['en', 'fr'])('every errors.* key resolves to a string in %s', (locale) => {
    const missing = keys.filter(k => !i18n.global.te(k, locale))
    expect(missing).toEqual([])
  })
})
