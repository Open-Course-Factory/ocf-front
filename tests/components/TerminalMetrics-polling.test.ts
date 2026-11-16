/**
 * The admin metrics page re-reads every connected backend's metrics on a 30s
 * timer, but only while somebody is looking at it: a background tab must not
 * keep hitting the backends, and comes back current the moment it is shown.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

vi.mock('../../src/stores/terminalMetrics', () => ({
  useTerminalMetricsStore: () => ({})
}))

const backend = { id: 'b1', name: 'Backend 1', connected: true }
vi.mock('../../src/stores/terminalBackends', () => ({
  useTerminalBackendsStore: () => ({
    backends: [backend],
    onlineBackends: [backend],
    defaultBackend: backend,
    fetchBackends: vi.fn().mockResolvedValue(undefined),
    setSystemDefault: vi.fn()
  })
}))

vi.mock('../../src/stores/organizations', () => ({
  useOrganizationsStore: () => ({
    organizations: [],
    loadOrganizations: vi.fn().mockResolvedValue(undefined)
  })
}))

import axios from 'axios'
import { setTabHidden } from '../helpers/tabVisibility'
import TerminalMetrics from '../../src/components/Pages/Admin/TerminalMetrics.vue'

const metricsCalls = () =>
  (axios.get as any).mock.calls.filter((c: any[]) => c[0] === '/terminals/metrics').length

function mountPage() {
  return mount(TerminalMetrics, {
    global: {
      plugins: [
        createI18n({ legacy: false, locale: 'en', messages: { en: {} }, missingWarn: false, fallbackWarn: false })
      ]
    }
  })
}

describe('TerminalMetrics — auto-refresh follows tab visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(axios.get as any).mockResolvedValue({ data: { cpu_percent: 10, ram_percent: 20, ram_available_gb: 8, timestamp: 0 } })
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  })

  afterEach(() => {
    setTabHidden(false)
    vi.useRealTimers()
  })

  it('polls the metrics every 30s while the tab is visible', async () => {
    mountPage()
    await flushPromises()
    ;(axios.get as any).mockClear()

    vi.advanceTimersByTime(30000)
    await flushPromises()

    expect(metricsCalls()).toBe(1)
  })

  it('does not poll the metrics while the tab is hidden', async () => {
    mountPage()
    await flushPromises()
    setTabHidden(true)
    ;(axios.get as any).mockClear()

    vi.advanceTimersByTime(120000)
    await flushPromises()

    expect(metricsCalls()).toBe(0)
  })

  it('refreshes at once and resumes polling when the tab is visible again', async () => {
    mountPage()
    await flushPromises()
    setTabHidden(true)
    vi.advanceTimersByTime(120000)
    await flushPromises()
    ;(axios.get as any).mockClear()

    setTabHidden(false)
    await flushPromises()
    expect(metricsCalls()).toBe(1)

    vi.advanceTimersByTime(30000)
    await flushPromises()
    expect(metricsCalls()).toBe(2)
  })

  it('stops polling once unmounted', async () => {
    const wrapper = mountPage()
    await flushPromises()
    wrapper.unmount()
    ;(axios.get as any).mockClear()

    vi.advanceTimersByTime(120000)
    await flushPromises()

    expect(metricsCalls()).toBe(0)
  })
})
