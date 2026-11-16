import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, defineComponent, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import i18n from '../../src/i18n'
import { currentUserTimezone, useFormatters } from '../../src/composables/useFormatters'
import { useUserSettingsStore } from '../../src/stores/userSettings'

const appLocale = i18n.global.locale.value
afterEach(() => {
  i18n.global.locale.value = appLocale
  vi.restoreAllMocks()
})

// The zone the browser reports, whatever the machine running the tests uses.
function stubBrowserZone(timeZone: string) {
  const real = Intl.DateTimeFormat.prototype.resolvedOptions
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (this: Intl.DateTimeFormat) {
    return { ...real.call(this), timeZone }
  })
}

describe('currentUserTimezone', () => {
  it('returns the zone saved in the real settings store', () => {
    // Ties the store id read by currentUserTimezone() to the real store:
    // renaming the store makes this fall back to the browser zone.
    stubBrowserZone('Europe/Paris')
    setActivePinia(createPinia())
    useUserSettingsStore().settings.timezone = 'Pacific/Auckland'

    expect(currentUserTimezone()).toBe('Pacific/Auckland')
  })

  it('falls back to the browser zone without an active pinia', () => {
    stubBrowserZone('Europe/Paris')
    setActivePinia(undefined)
    expect(currentUserTimezone()).toBe('Europe/Paris')
  })

  it('falls back to the browser zone before the settings store exists', () => {
    stubBrowserZone('Europe/Paris')
    setActivePinia(createPinia())
    expect(currentUserTimezone()).toBe('Europe/Paris')
  })

  it('falls back to the browser zone when no zone is saved', () => {
    stubBrowserZone('Europe/Paris')
    setActivePinia(createPinia())
    useUserSettingsStore().settings.timezone = ''
    expect(currentUserTimezone()).toBe('Europe/Paris')
  })

  it('treats a saved UTC as not chosen: the backend stores UTC for everyone by default', () => {
    stubBrowserZone('Europe/Paris')
    setActivePinia(createPinia())
    useUserSettingsStore().settings.timezone = 'UTC'
    expect(currentUserTimezone()).toBe('Europe/Paris')
  })
})

describe('useFormatters', () => {
  it('re-renders a mounted price when the app language changes', async () => {
    setActivePinia(createPinia())
    i18n.global.locale.value = 'en'
    const PriceLabel = defineComponent({
      setup() {
        const { formatPrice } = useFormatters()
        const label = computed(() => formatPrice(1999, 'EUR'))
        return { label }
      },
      template: '<span>{{ label }}</span>',
    })
    const wrapper = mount(PriceLabel)
    expect(wrapper.text()).toBe('€19.99')

    i18n.global.locale.value = 'fr'
    await nextTick()

    expect(wrapper.text()).toBe('19,99\u00a0€')
  })
})
