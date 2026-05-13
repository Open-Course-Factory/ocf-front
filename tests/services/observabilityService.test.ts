import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock axios at the HTTP boundary BEFORE importing the service.
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

import axios from 'axios'
import { observabilityService } from '../../src/services/domain/admin/observabilityService'
import type { ObservabilityMetrics } from '../../src/services/domain/admin/observabilityService'

const mockedAxios = vi.mocked(axios)

describe('observabilityService.getMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs the admin observability metrics endpoint', async () => {
    const payload: ObservabilityMetrics = {
      stripe: {
        create: { success: 0, failure: 0 },
        update: { success: 0, failure: 0 },
        archive: { success: 0, failure: 0 },
        panics: 0,
        queue: { retry: 0, exhausted: 0, pending_depth: 0 }
      },
      scenarios: {
        setup_panics: 0,
        setup_failed_transitions: 0,
        terminal_stop_failures: 0
      },
      hooks: { recent_errors: [] }
    }
    mockedAxios.get.mockResolvedValueOnce({ data: payload })

    const result = await observabilityService.getMetrics()

    expect(mockedAxios.get).toHaveBeenCalledWith('/admin/observability-metrics')
    expect(result).toEqual(payload)
  })

  it('passes through populated hook errors and non-zero counters', async () => {
    const payload: ObservabilityMetrics = {
      stripe: {
        create: { success: 5, failure: 2 },
        update: { success: 1, failure: 0 },
        archive: { success: 0, failure: 0 },
        panics: 0,
        queue: { retry: 2, exhausted: 0, pending_depth: 0 }
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
    mockedAxios.get.mockResolvedValueOnce({ data: payload })

    const result = await observabilityService.getMetrics()

    expect(result.stripe.create.failure).toBe(2)
    expect(result.stripe.queue.retry).toBe(2)
    expect(result.hooks.recent_errors).toHaveLength(1)
    expect(result.hooks.recent_errors[0].hook_name).toBe('stripe_subscription_plan_sync')
  })
})
