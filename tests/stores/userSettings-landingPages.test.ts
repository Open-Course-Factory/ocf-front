/**
 * Groups must be offerable as a landing page (issue #307).
 *
 * A teacher whose day starts on their classes had no way to land there: the
 * default-landing-page picker only offered Courses, Subscription Dashboard and
 * Terminal Sessions. `/class-groups` joins them, behind the same `class_groups`
 * feature flag that gates the Groups category in the nav menu — the picker must
 * never offer a page the flag has switched off.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const enabledFlags = new Set<string>()

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isEnabled: (flag: string) => enabledFlags.has(flag),
  }),
}))

vi.mock('../../src/utils/asyncWrapper', () => ({
  createAsyncWrapper: () => async (fn: () => Promise<any>) => fn(),
}))

// Translations are NOT mocked: the labels are user-facing text and the point of
// half these assertions is that they exist in both locales.
import i18n from '../../src/i18n'
import { useUserSettingsStore } from '../../src/stores/userSettings'

function landingPagesFor(locale: 'en' | 'fr', flags: string[]) {
  enabledFlags.clear()
  flags.forEach((flag) => enabledFlags.add(flag))
  i18n.global.locale.value = locale
  setActivePinia(createPinia())

  return useUserSettingsStore().availablePages
}

function labelOf(pages: { value: string; label: string }[], route: string) {
  return pages.find((page) => page.value === route)?.label
}

describe('userSettings — default landing page options', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'en'
    enabledFlags.clear()
  })

  it('offers Groups when the class_groups flag is on', () => {
    const pages = landingPagesFor('en', ['class_groups'])

    expect(pages.map((page) => page.value)).toContain('/class-groups')
  })

  it('withholds Groups when the class_groups flag is off', () => {
    const pages = landingPagesFor('en', ['course_conception', 'terminal_management'])

    expect(pages.map((page) => page.value)).not.toContain('/class-groups')
  })

  it('labels every offered page in English', () => {
    const pages = landingPagesFor('en', ['class_groups', 'course_conception', 'terminal_management'])

    expect(labelOf(pages, '/class-groups')).toBe('Groups')
    expect(labelOf(pages, '/courses')).toBe('Courses')
    expect(labelOf(pages, '/terminal-sessions')).toBe('Terminal sessions')
    expect(labelOf(pages, '/subscription-dashboard')).toBe('Subscription dashboard')
  })

  it('labels every offered page in French', () => {
    const pages = landingPagesFor('fr', ['class_groups', 'course_conception', 'terminal_management'])

    expect(labelOf(pages, '/class-groups')).toBe('Groupes')
    expect(labelOf(pages, '/courses')).toBe('Cours')
    expect(labelOf(pages, '/terminal-sessions')).toBe('Sessions de terminal')
    expect(labelOf(pages, '/subscription-dashboard')).toBe('Tableau de bord d\'abonnement')
  })

  it('keeps the pages the picker already offered', () => {
    const pages = landingPagesFor('en', ['course_conception', 'terminal_management'])
    const routes = pages.map((page) => page.value)

    expect(routes).toContain('/courses')
    expect(routes).toContain('/subscription-dashboard')
    expect(routes).toContain('/terminal-sessions')
  })
})
