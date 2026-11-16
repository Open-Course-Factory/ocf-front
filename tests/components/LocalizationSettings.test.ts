/**
 * The time zone select says what dates actually use. ocf-core saves 'UTC' as
 * every user's default and dates read it as "not chosen" (browser zone), so
 * the select must show "Automatic" for it and must not offer a UTC it cannot
 * honour.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import { COMMON_TIMEZONES } from '../../src/utils/formatters'

const store = reactive({
  settings: { preferred_language: 'en', timezone: 'UTC' } as Record<string, string>,
  availableLanguages: [{ value: 'en', label: 'English' }],
  availableTimezones: COMMON_TIMEZONES,
  updateSettings: vi.fn(async () => undefined),
})

vi.mock('../../src/stores/userSettings', () => ({ useUserSettingsStore: () => store }))
vi.mock('../../src/composables/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('../../src/composables/useLocale', () => ({ useLocale: () => ({ setLocale: vi.fn() }) }))

import LocalizationSettings from '../../src/components/Settings/LocalizationSettings.vue'

function mountSettings() {
  return mount(LocalizationSettings, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: { SettingsCard: { template: '<div><slot /></div>' } },
    },
  })
}

const timezoneSelect = (wrapper: ReturnType<typeof mountSettings>) => wrapper.findAll('select')[1]

describe('LocalizationSettings — time zone', () => {
  beforeEach(() => {
    store.settings = { preferred_language: 'en', timezone: 'UTC' }
    store.updateSettings.mockClear()
  })

  it('shows the backend default UTC as Automatic', () => {
    const select = timezoneSelect(mountSettings()).element as HTMLSelectElement
    // An unmatched value also reads '': check that the Automatic option is the one selected.
    expect(select.selectedOptions[0]?.textContent ?? 'no option selected').toContain('timezoneAuto')
  })

  it('does not offer UTC, which dates would not honour', () => {
    const values = timezoneSelect(mountSettings()).findAll('option').map(o => o.attributes('value'))
    expect(values).not.toContain('UTC')
    expect(values).toContain('Europe/Paris')
  })

  it('saves Automatic as an empty zone', async () => {
    store.settings = { preferred_language: 'en', timezone: 'Europe/Paris' }
    const select = timezoneSelect(mountSettings())
    await select.setValue('')
    await flushPromises()
    expect(store.updateSettings).toHaveBeenCalledWith({ preferred_language: 'en', timezone: '' })
  })
})
