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
import { formatBudgetAsSizes, CANONICAL_SIZE_CATALOG } from '../../src/utils/quotaFormatters'

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
    // Capacity is rendered in raw vCPU/RAM (not size-count): max_cpu=8000 mCPU
    // → "8 vCPU"; max_memory_mb=4096 → "4.0 GiB".
    expect(text).toContain('8 vCPU')
    expect(text).toContain('4.0 GiB')
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

  it('renders each session machine size specs (vCPU + RAM) alongside the size key', async () => {
    mockGetMyUsage.mockResolvedValue(makeUsage({
      active_sessions: [
        {
          session_id: 'sess-1',
          name: 'ubuntu-dev',
          size_key: 'm',
          // size_cpu is mCPU on the wire (500 = 0.5 vCPU).
          size_cpu: 500,
          size_memory_mb: 1024,
          state: 'running',
          persistence_mode: 'persistent',
          last_started_at: new Date(Date.now() - 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }
      ]
    }))
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('.collapsible-header').trigger('click')
    await flushPromises()

    const row = wrapper.find('[data-test="session-row"]')
    expect(row.exists()).toBe(true)
    // Uppercased size key.
    expect(row.text()).toContain('M')
    // Specs formatted via the shared helpers: 500 mCPU → "0.5 vCPU", 1024 MiB → "1.0 GiB".
    const specs = row.find('[data-test="session-specs"]')
    expect(specs.exists()).toBe(true)
    expect(specs.text()).toContain('0.5 vCPU')
    expect(specs.text()).toContain('1.0 GiB')
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

describe('TerminalUsagePanel — remaining capacity as sizes', () => {
  // Policy (feedback_quota_ux_size_count): the panel must speak the customer's
  // language — "how many more machines can I launch" — not raw GiB/vCPU. This
  // primary line is derived from the REMAINING budget (max − used) via the same
  // formatBudgetAsSizes helper the plan cards use, so the two never drift. The
  // raw CPU/RAM bars stay as secondary detail.
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountExpanded(
    overrides: Partial<MyTerminalUsageResponse> = {},
    locale: 'en' | 'fr' = 'en'
  ) {
    mockGetMyUsage.mockResolvedValue(makeUsage(overrides))
    const wrapper = mountPanel({}, locale)
    await flushPromises()
    await wrapper.find('.collapsible-header').trigger('click')
    await flushPromises()
    return wrapper
  }

  it('renders a primary size-count line from the remaining budget, using the shared helper', async () => {
    // Default fixture: max 8000/4096, used 4000/2048 → remaining 4000/2048.
    // The rendered line MUST equal formatBudgetAsSizes on that remaining budget
    // (SSOT with the plan cards), not a parallel reimplementation.
    const expectedSizes = formatBudgetAsSizes(
      { max_cpu: 4000, max_memory_mb: 2048 },
      CANONICAL_SIZE_CATALOG,
      'OR'
    )
    expect(expectedSizes).toBe('1 L OR 2 M OR 4 S') // guard the fixture math

    const wrapper = await mountExpanded()
    const line = wrapper.find('[data-testid="remaining-capacity"]')
    expect(line.exists()).toBe(true)

    const text = line.text()
    expect(text).toContain('Remaining capacity')
    // Approximate marker — it's a best-fit estimate, not an exact allocation.
    expect(text).toContain('≈')
    expect(text).toContain(expectedSizes)
  })

  it('keeps the raw CPU/RAM bars as secondary detail alongside the size-count line', async () => {
    const wrapper = await mountExpanded()
    // The new line must not replace the bars.
    expect(wrapper.find('[data-testid="remaining-capacity"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="cpu-bar-fill"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="mem-bar-fill"]').exists()).toBe(true)
  })

  it('shows the remaining line in the localized joiner (fr → OU)', async () => {
    const expectedSizes = formatBudgetAsSizes(
      { max_cpu: 4000, max_memory_mb: 2048 },
      CANONICAL_SIZE_CATALOG,
      'OU'
    )
    expect(expectedSizes).toBe('1 L OU 2 M OU 4 S')

    const wrapper = await mountExpanded({}, 'fr')
    const line = wrapper.find('[data-testid="remaining-capacity"]')
    expect(line.exists()).toBe(true)
    const text = line.text()
    expect(text).toContain('Capacité restante')
    expect(text).toContain(expectedSizes)
  })

  it('says unlimited (not "≈ 0") when the plan has no cap', async () => {
    const wrapper = await mountExpanded(
      { max_cpu: 0, max_memory_mb: 0, used_cpu: 0, used_memory_mb: 0 },
      'fr'
    )
    const line = wrapper.find('[data-testid="remaining-capacity"]')
    expect(line.exists()).toBe(true)
    const text = line.text()
    expect(text).toMatch(/illimit/i)
    expect(text).not.toContain('≈ 0')
  })

  it('renders an actionable message (not "≈ 0 ×") when the budget is fully consumed', async () => {
    // Capped plan, fully used → remaining CPU/RAM are 0. This must NOT read as
    // unlimited, and must NOT print a nonsensical "≈ 0" size line — it should
    // tell the user how to free capacity.
    const wrapper = await mountExpanded({
      max_cpu: 8000,
      max_memory_mb: 4096,
      used_cpu: 8000,
      used_memory_mb: 4096,
    })
    const line = wrapper.find('[data-testid="remaining-capacity"]')
    expect(line.exists()).toBe(true)
    const text = line.text()
    expect(text).not.toContain('≈')
    expect(text).not.toMatch(/\bOR\b/) // no size-count string
    // Actionable: point the user at stopping a session to reclaim budget.
    expect(text.toLowerCase()).toContain('stop a session')
  })
})
