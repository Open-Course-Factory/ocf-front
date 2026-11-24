/**
 * From the class view a teacher switches the watched scenario's public port
 * exposure on or off. It is the scenario's own setting (the lab editor's
 * « Exposition publique de ports »), so it applies to every class running it.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const mockGetScenario = vi.fn()
const mockSetPortExposure = vi.fn()
const mockShowError = vi.fn()

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showError: (...a: any[]) => mockShowError(...a) })
}))

vi.mock('../../src/services/domain/scenario', () => ({
  scenarioSessionService: {
    getScenario: (...a: any[]) => mockGetScenario(...a)
  },
  teacherService: {
    setPortExposure: (...a: any[]) => mockSetPortExposure(...a)
  }
}))

import ClassPortExposureToggle from '../../src/components/Groups/ClassPortExposureToggle.vue'

function mountToggle(scenarioId = 'sc-1') {
  return mount(ClassPortExposureToggle, {
    props: { scenarioId },
    global: {
      plugins: [createI18n({
        legacy: false, locale: 'en', fallbackLocale: 'en',
        messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false
      })]
    }
  })
}

const toggle = (wrapper: ReturnType<typeof mountToggle>) =>
  wrapper.find('[data-testid="class-port-exposure-toggle"]')

describe('ClassPortExposureToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows whether the scenario lets learners expose a port', async () => {
    mockGetScenario.mockResolvedValue({ id: 'sc-1', port_exposure_allowed: true })
    const wrapper = mountToggle()
    await flushPromises()

    expect(mockGetScenario).toHaveBeenCalledWith('sc-1')
    expect(toggle(wrapper).attributes('aria-pressed')).toBe('true')
    expect(toggle(wrapper).text()).toContain('Public ports: on')
  })

  it('switches the setting and shows what the scenario now holds', async () => {
    mockGetScenario.mockResolvedValue({ id: 'sc-1', port_exposure_allowed: true })
    mockSetPortExposure.mockResolvedValue(false)
    const wrapper = mountToggle()
    await flushPromises()

    await toggle(wrapper).trigger('click')
    await flushPromises()

    expect(mockSetPortExposure).toHaveBeenCalledWith('sc-1', false)
    expect(toggle(wrapper).attributes('aria-pressed')).toBe('false')
    expect(toggle(wrapper).text()).toContain('Public ports: off')
  })

  it('keeps the setting and says so when the change is refused', async () => {
    mockGetScenario.mockResolvedValue({ id: 'sc-1', port_exposure_allowed: false })
    mockSetPortExposure.mockRejectedValue({ response: { status: 403, data: { error_message: 'Forbidden' } } })
    const wrapper = mountToggle()
    await flushPromises()

    await toggle(wrapper).trigger('click')
    await flushPromises()

    expect(mockShowError).toHaveBeenCalledTimes(1)
    expect(mockShowError.mock.calls[0][0]).toBe('Forbidden')
    expect(toggle(wrapper).attributes('aria-pressed')).toBe('false')
    expect(toggle(wrapper).attributes('disabled')).toBeUndefined()
  })
})
