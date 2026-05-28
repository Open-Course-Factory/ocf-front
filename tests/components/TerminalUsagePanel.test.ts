/**
 * Tests for TerminalUsagePanel — live budget mode.
 *
 * The panel owns its own data lifecycle: on mount it calls
 * terminalService.getMyUsage(organizationId) and renders:
 *   - Plan name + source ("personal" / "provided by X")
 *   - Capacity reminder (size-count summary)
 *   - CPU + RAM progress bars (used / max)
 *   - Active sessions list (with paused entries for stopped persistent)
 *   - Session duration footer
 *
 * It re-fetches when the organizationId prop changes and shows an empty
 * state when there are no active sessions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import type { MyTerminalUsageResponse } from '../../src/types/terminal'

// ---- Mocks (must be set up before component import) ----

const mockGetMyUsage = vi.fn()

vi.mock('../../src/services/domain/terminal', () => ({
  terminalService: {
    getMyUsage: (...args: any[]) => mockGetMyUsage(...args),
  }
}))

// Avoid pulling in element-plus during component import.
vi.mock('../../src/composables/useNotification', () => ({
  useNotification: () => ({
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showConfirm: vi.fn(),
  })
}))

import TerminalUsagePanel from '../../src/components/Terminal/TerminalUsagePanel.vue'

function createTestI18n(locale: 'en' | 'fr' = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function mountPanel(props: { organizationId?: string } = {}, locale: 'en' | 'fr' = 'en') {
  return mount(TerminalUsagePanel, {
    props,
    global: {
      plugins: [createTestI18n(locale)],
    },
  })
}

function makeUsage(overrides: Partial<MyTerminalUsageResponse> = {}): MyTerminalUsageResponse {
  return {
    plan_name: 'Pro',
    plan_source: 'personal',
    plan_source_name: '',
    // CPU values are mCPU on the wire (8 vCPU = 8000 mCPU).
    max_cpu: 8000,
    max_memory_mb: 4096,
    max_session_duration_minutes: 60,
    used_cpu: 4000,
    used_memory_mb: 2048,
    active_sessions: [
      {
        session_id: 'sess-1',
        name: 'ubuntu-dev',
        size_key: 'L',
        size_cpu: 4,
        size_memory_mb: 2048,
        state: 'running',
        persistence_mode: 'persistent',
        last_started_at: new Date(Date.now() - 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }
    ],
    ...overrides
  }
}

describe('TerminalUsagePanel — live usage view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches usage on mount and renders the plan + capacity', async () => {
    mockGetMyUsage.mockResolvedValue(makeUsage())
    const wrapper = mountPanel({ organizationId: undefined })
    await flushPromises()

    // Expand the collapsible header
    await wrapper.find('.collapsible-header').trigger('click')
    await flushPromises()

    expect(mockGetMyUsage).toHaveBeenCalledTimes(1)
    expect(mockGetMyUsage).toHaveBeenCalledWith(undefined)

    const text = wrapper.text()
    // Plan + source rendered
    expect(text).toContain('Pro')
    // Capacity summary uses the size-count helper, max_cpu=8000 mCPU /
    // max_memory_mb=4096 → "1 XL OR 2 L OR 4 M"
    expect(text).toMatch(/1\s*XL/)
  })

  it('renders the CPU and RAM bars at the correct fill percentages', async () => {
    mockGetMyUsage.mockResolvedValue(makeUsage({
      max_cpu: 8000,
      max_memory_mb: 4096,
      used_cpu: 4000,
      used_memory_mb: 2048,
    }))
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('.collapsible-header').trigger('click')
    await flushPromises()

    const cpuFill = wrapper.find('[data-test="cpu-bar-fill"]')
    const memFill = wrapper.find('[data-test="mem-bar-fill"]')
    expect(cpuFill.exists()).toBe(true)
    expect(memFill.exists()).toBe(true)

    const cpuStyle = cpuFill.attributes('style') || ''
    const memStyle = memFill.attributes('style') || ''
    expect(cpuStyle).toMatch(/width:\s*50%/)
    expect(memStyle).toMatch(/width:\s*50%/)
  })

  it('renders Illimité (unlimited) when max_cpu === 0', async () => {
    mockGetMyUsage.mockResolvedValue(makeUsage({
      max_cpu: 0,
      max_memory_mb: 4096,
      used_cpu: 0,
    }))
    const wrapper = mountPanel({}, 'fr')
    await flushPromises()
    await wrapper.find('.collapsible-header').trigger('click')
    await flushPromises()

    // The CPU axis is unlimited — the bar fill must be absent (or the
    // unlimited label must render).
    const text = wrapper.text()
    expect(text).toContain('Illimité')
  })

  it('renders one row per active session, including paused entries', async () => {
    mockGetMyUsage.mockResolvedValue(makeUsage({
      active_sessions: [
        {
          session_id: 'sess-1',
          name: 'ubuntu-dev',
          size_key: 'L',
          size_cpu: 4,
          size_memory_mb: 2048,
          state: 'running',
          persistence_mode: 'persistent',
          last_started_at: new Date(Date.now() - 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        {
          session_id: 'sess-2',
          name: 'exam-prep',
          size_key: 'S',
          size_cpu: 1,
          size_memory_mb: 512,
          state: 'stopped',
          persistence_mode: 'persistent',
          last_started_at: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }
      ]
    }))
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('.collapsible-header').trigger('click')
    await flushPromises()

    const rows = wrapper.findAll('[data-test="session-row"]')
    expect(rows.length).toBe(2)
    expect(rows[0].text()).toContain('ubuntu-dev')
    expect(rows[1].text()).toContain('exam-prep')
  })

  it('renders the empty state when there are no active sessions', async () => {
    mockGetMyUsage.mockResolvedValue(makeUsage({ active_sessions: [] }))
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('.collapsible-header').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="usage-panel-empty"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="session-row"]').length).toBe(0)
  })

  it('re-fetches when the organizationId prop changes', async () => {
    mockGetMyUsage.mockResolvedValue(makeUsage())
    const wrapper = mountPanel({ organizationId: 'org-a' })
    await flushPromises()

    expect(mockGetMyUsage).toHaveBeenCalledTimes(1)
    expect(mockGetMyUsage).toHaveBeenLastCalledWith('org-a')

    await wrapper.setProps({ organizationId: 'org-b' })
    await flushPromises()

    expect(mockGetMyUsage).toHaveBeenCalledTimes(2)
    expect(mockGetMyUsage).toHaveBeenLastCalledWith('org-b')
  })

  it('uses localized strings for the capacity label (fr vs en)', async () => {
    mockGetMyUsage.mockResolvedValue(makeUsage())
    const frWrapper = mountPanel({}, 'fr')
    await flushPromises()
    await frWrapper.find('.collapsible-header').trigger('click')
    await flushPromises()

    expect(frWrapper.text()).toContain('Capacité')

    mockGetMyUsage.mockClear()
    mockGetMyUsage.mockResolvedValue(makeUsage())
    const enWrapper = mountPanel({}, 'en')
    await flushPromises()
    await enWrapper.find('.collapsible-header').trigger('click')
    await flushPromises()

    expect(enWrapper.text()).toContain('Capacity')
  })
})
