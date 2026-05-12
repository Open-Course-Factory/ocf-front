import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---- Mocks (must be before component imports) ----

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  }
}))

// Make useTranslations a passthrough that returns the key — keeps assertions
// stable across locales and avoids needing real message bundles.
vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key })
}))

import axios from 'axios'
import { mount, flushPromises } from '@vue/test-utils'
import AdminObservability from '../../src/components/Pages/Admin/AdminObservability.vue'
import type { ObservabilityMetrics } from '../../src/services/domain/admin/observabilityService'

const mockedAxios = vi.mocked(axios)

const zeroMetrics: ObservabilityMetrics = {
  stripe: {
    create: { success: 0, failure: 0 },
    update: { success: 0, failure: 0 },
    archive: { success: 0, failure: 0 },
    panics: 0
  },
  scenarios: {
    setup_panics: 0,
    setup_failed_transitions: 0,
    terminal_stop_failures: 0
  },
  hooks: { recent_errors: [] }
}

const populatedMetrics: ObservabilityMetrics = {
  stripe: {
    create: { success: 5, failure: 2 },
    update: { success: 1, failure: 0 },
    archive: { success: 0, failure: 0 },
    panics: 0
  },
  scenarios: {
    setup_panics: 1,
    setup_failed_transitions: 3,
    terminal_stop_failures: 0
  },
  hooks: {
    recent_errors: [
      {
        hook_name: 'stripe_subscription_plan_sync',
        entity_name: 'SubscriptionPlan',
        hook_type: 'AfterCreate',
        error: 'connection refused',
        timestamp: '2026-05-13T10:00:00Z'
      }
    ]
  }
}

describe('AdminObservability.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty state when no hook errors are present', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: zeroMetrics })

    const wrapper = mount(AdminObservability)
    await flushPromises()

    // useTranslations is mocked to return the key — assert against the key directly.
    expect(wrapper.text()).toContain('adminObservability.hooks.noRecentErrors')
  })

  it('shows recent hook errors when present', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: populatedMetrics })

    const wrapper = mount(AdminObservability)
    await flushPromises()

    // The error message text and hook name must be surfaced somewhere in the page.
    expect(wrapper.text()).toContain('connection refused')
    expect(wrapper.text()).toContain('stripe_subscription_plan_sync')
  })

  it('refetches when the refresh button is clicked', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: zeroMetrics })
      .mockResolvedValueOnce({ data: populatedMetrics })

    const wrapper = mount(AdminObservability)
    await flushPromises()
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)

    const refreshBtn = wrapper.find('[data-testid="refresh-button"]')
    expect(refreshBtn.exists()).toBe(true)
    await refreshBtn.trigger('click')
    await flushPromises()

    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
  })
})
