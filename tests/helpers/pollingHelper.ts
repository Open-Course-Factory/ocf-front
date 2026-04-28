import { vi } from 'vitest'
import type { Mock } from 'vitest'

/**
 * Test helper for the subscription upgrade polling flow.
 *
 * Wires the mocked axios GET to the two endpoints the polling loop touches
 * (`/user-subscriptions/current` and `/user-subscriptions/usage`) and the
 * POST to `/user-subscriptions/upgrade`. Per-test logic only needs to
 * describe what `/current` returns on each poll attempt; the rest of the
 * URL routing is shared boilerplate.
 *
 * Usage:
 *   setupSubscriptionPollingMocks(mockedAxios, {
 *     // Constant response — every poll returns the same thing
 *     current: () => ({ id: 'sub-1', subscription_plan_id: 'plan-old', status: 'active' })
 *   })
 *
 *   // Or sequence-aware (1-indexed call number, may throw to simulate errors)
 *   setupSubscriptionPollingMocks(mockedAxios, {
 *     current: (n) => n >= 3
 *       ? { id: 'sub-1', subscription_plan_id: 'plan-new', status: 'active' }
 *       : { id: 'sub-1', subscription_plan_id: 'plan-old', status: 'active' }
 *   })
 */

type AxiosGetMock = { get: Mock; post: Mock }

interface CurrentSubscriptionResponse {
  id: string
  subscription_plan_id: string
  status: string
  [key: string]: unknown
}

interface UsageMetric {
  metric_type: string
  current_value: number
  limit_value: number
  [key: string]: unknown
}

export interface SubscriptionPollingMocks {
  /**
   * Resolves the response for the n-th call (1-indexed) to
   * `/user-subscriptions/current`. Throw to simulate transient errors.
   */
  current: (callIndex: number) => CurrentSubscriptionResponse
  /** Optional usage metrics returned from `/user-subscriptions/usage`. Defaults to []. */
  usage?: UsageMetric[]
  /** Optional response body for the upgrade POST. Defaults to `{ success: true }`. */
  upgradeResponse?: Record<string, unknown>
}

export function setupSubscriptionPollingMocks(
  mockedAxios: AxiosGetMock,
  opts: SubscriptionPollingMocks
): void {
  const usage = opts.usage ?? []
  const upgradeResponse = opts.upgradeResponse ?? { success: true }

  let currentCalls = 0
  mockedAxios.get.mockImplementation(async (url: string) => {
    if (url.startsWith('/user-subscriptions/current')) {
      currentCalls++
      return { data: opts.current(currentCalls) }
    }
    if (url.startsWith('/user-subscriptions/usage')) {
      return { data: usage }
    }
    return { data: {} }
  })

  mockedAxios.post.mockResolvedValue({ data: upgradeResponse })
}
