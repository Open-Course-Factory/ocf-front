/**
 * The clock date on a session row means two different things:
 *   - ephemeral session: the machine is destroyed at that time ("Expires on")
 *   - persistent session: the machine is only put to sleep ("Auto-stops on")
 * A stopped or deleted session shows no date at all — the moment has passed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    stopSession: vi.fn(),
    startSession: vi.fn(),
    deleteSession: vi.fn(),
    getDistributions: vi.fn().mockResolvedValue([])
  }
}))

vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showConfirm: vi.fn().mockResolvedValue(true),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showMessage: vi.fn(),
    showAlert: vi.fn(),
    showPrompt: vi.fn()
  })
}))

vi.mock('../../src/composables/useFormatters', () => ({
  useFormatters: () => ({
    formatDateTime: (s: string) => s
  })
}))

vi.mock('../../src/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ isEnabled: () => false })
}))

vi.mock('../../src/stores/classGroups', () => ({
  useClassGroupsStore: () => ({ entities: [], loadEntities: vi.fn() })
}))

import axios from 'axios'
import TerminalMySessions from '../../src/components/Pages/TerminalMySessions.vue'

const FUTURE = new Date(Date.now() + 3_600_000).toISOString()
const PAST = new Date(Date.now() - 3_600_000).toISOString()

function mountPage(sessions: Record<string, unknown>[]) {
  setActivePinia(createPinia())
  ;(axios.get as any).mockResolvedValue({ data: sessions })
  return mount(TerminalMySessions, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en: {}, fr: {} }, missingWarn: false, fallbackWarn: false })],
      stubs: {
        'router-link': { props: ['to'], template: '<a><slot /></a>' },
        ErrorAlert: true
      }
    }
  })
}

describe('TerminalMySessions — expiry date wording', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ephemeral running session: the date is an expiry', async () => {
    const wrapper = mountPage([
      { id: 'a', session_id: 's-eph', state: 'running', persistence_mode: 'ephemeral', expires_at: FUTURE }
    ])
    await flushPromises()
    const el = wrapper.find('[data-test="session-expiry-s-eph"]')
    expect(el.exists()).toBe(true)
    expect(el.attributes('title')).toBe('Expires on')
  })

  it('persistent running session: the date is an auto-stop', async () => {
    const wrapper = mountPage([
      { id: 'b', session_id: 's-per', state: 'running', persistence_mode: 'persistent', expires_at: FUTURE }
    ])
    await flushPromises()
    const el = wrapper.find('[data-test="session-expiry-s-per"]')
    expect(el.exists()).toBe(true)
    expect(el.attributes('title')).toBe('Auto-stops on')
  })

  it('stopped persistent session: no stale date', async () => {
    const wrapper = mountPage([
      { id: 'c', session_id: 's-stop', state: 'stopped', persistence_mode: 'persistent', expires_at: PAST }
    ])
    await flushPromises()
    expect(wrapper.find('[data-test="session-expiry-s-stop"]').exists()).toBe(false)
  })
})
