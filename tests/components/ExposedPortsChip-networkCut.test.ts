/**
 * ExposedPortsChip — the learner's notice when the training team cut the
 * session's internet (#384).
 *
 * A session without internet cannot expose a port, and the chip says why. When
 * the session was started with internet and a trainer cut it
 * (`network_disabled`), "start a session with internet access" is wrong: the
 * chip says the training team turned internet off instead. The viewer passes
 * that as the `networkCut` prop.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

const getExposedPorts = vi.fn()
vi.mock('../../src/services/domain/terminal/terminalService', () => ({
  terminalService: {
    getExposedPorts: (...args: unknown[]) => getExposedPorts(...args),
    createExposedPort: vi.fn(),
    deleteExposedPort: vi.fn()
  }
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({ showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn(), showWarning: vi.fn() })
}))

import ExposedPortsChip from '../../src/components/Terminal/ExposedPortsChip.vue'

async function mountChip(props: Record<string, unknown>, locale: 'en' | 'fr' = 'en') {
  const wrapper = mount(ExposedPortsChip, {
    props: { sessionId: 'sess-1', isActive: true, ...props },
    attachTo: document.body,
    global: {
      plugins: [createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: { Button: { template: '<button><slot /></button>' } }
    }
  })
  await flushPromises()
  await wrapper.find('[data-testid="exposed-ports-chip"]').trigger('click')
  await flushPromises()
  return wrapper
}

describe('ExposedPortsChip — internet cut by the training team', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    getExposedPorts.mockResolvedValue([])
  })

  it('says the training team turned internet off, not to start another session', async () => {
    const wrapper = await mountChip({ hasNetwork: false, networkCut: true })

    const notice = wrapper.find('.ports-locked')
    expect(notice.exists()).toBe(true)
    expect(notice.text()).toMatch(/training team cut internet/i)
    expect(notice.text()).not.toMatch(/turned .* off/i)
    expect(notice.text()).not.toMatch(/Start a session/i)
    expect(wrapper.find('[data-testid="exposed-ports-chip"]').attributes('title')).toBe(notice.text())
    expect(wrapper.find('.ports-form').exists()).toBe(false)
  })

  it('says it in French', async () => {
    const wrapper = await mountChip({ hasNetwork: false, networkCut: true }, 'fr')

    const text = wrapper.find('.ports-locked').text()
    expect(text).toMatch(/équipe pédagogique/i)
    expect(text).toMatch(/coupé/i)
    expect(text).not.toMatch(/Démarrez une session/i)
  })

  it('keeps the start-with-internet hint for a session started without internet', async () => {
    const wrapper = await mountChip({ hasNetwork: false, networkCut: false })

    expect(wrapper.find('.ports-locked').text()).toMatch(/Start a session with internet access/i)
  })
})
