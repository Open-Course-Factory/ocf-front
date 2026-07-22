/**
 * CHARACTERIZATION — organizationSubscriptions store (refactor #267, finding I3).
 *
 * These tests pin the CURRENT observable behavior of the hand-rolled
 * isLoading/error + try/catch in src/stores/organizationSubscriptions.ts BEFORE
 * it is migrated onto the base-store async helpers. They are GREEN today and
 * must stay GREEN through a behavior-neutral refactor.
 *
 * What is pinned (the contract the components rely on):
 *   - which endpoint + HTTP verb each method calls
 *   - the `response.data.data || response.data` unwrap (wrapped and bare shapes)
 *   - the error fallback landing in `error.value`
 *   - isLoading true during flight, false after BOTH success and failure
 *   - the subscribeOrganization "plan required" guard firing before any request
 *   - demo-mode short-circuit (no network, bespoke demo payload)
 *
 * Error shapes are chosen to describe the contract a correct refactor onto
 * handleStoreError preserves: an axios error carrying `error_message`, a native
 * Error (the guard throw), and an unknown-shape error falling back to the key.
 * The current code's quirks around `response.data.message` are documented in the
 * refactor report, NOT pinned here (they would drift and are behavior-neutral to
 * fix). handleStoreError is deliberately NOT mocked so its real extraction runs
 * once the store is migrated.
 *
 * t() is a passthrough (useStoreTranslations mocked → key), so a fallback that
 * routes through t() resolves to its translation key.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

// Mocks MUST be defined BEFORE imports.
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

vi.mock('../../src/composables/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') }),
  useStoreTranslations: () => ({ t: (key: string) => key, te: () => true, locale: ref('en') })
}))

// isDemoMode default false → methods hit axios. Individual tests flip it on.
vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

import axios from 'axios'
import { isDemoMode } from '../../src/services/demo'
import { useOrganizationSubscriptionsStore } from '../../src/stores/organizationSubscriptions'

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}
const mockedIsDemoMode = isDemoMode as unknown as ReturnType<typeof vi.fn>

// A manually controlled promise, to observe isLoading mid-flight.
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('organizationSubscriptions store (characterization #267)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockedIsDemoMode.mockReturnValue(false)
  })

  describe('loadOrganizationSubscription', () => {
    it('GETs /organizations/:id/subscription and unwraps response.data.data', async () => {
      const payload = { id: 'sub-1', status: 'active' }
      mockedAxios.get.mockResolvedValueOnce({ data: { data: payload } })
      const store = useOrganizationSubscriptionsStore()

      const result = await store.loadOrganizationSubscription('org-1')

      expect(mockedAxios.get).toHaveBeenCalledWith('/organizations/org-1/subscription')
      expect(result).toBe(payload)
    })

    it('unwraps a bare response.data payload (no nested .data)', async () => {
      const payload = { id: 'sub-2', status: 'active' }
      mockedAxios.get.mockResolvedValueOnce({ data: payload })
      const store = useOrganizationSubscriptionsStore()

      const result = await store.loadOrganizationSubscription('org-1')

      expect(result).toBe(payload)
    })

    it('surfaces error_message into error.value and rethrows', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400, data: { error_message: 'no subscription' } }
      })
      const store = useOrganizationSubscriptionsStore()

      await expect(store.loadOrganizationSubscription('org-1')).rejects.toBeDefined()
      expect(store.error).toBe('no subscription')
    })

    it('falls back to the loadError key for an unknown-shape error', async () => {
      mockedAxios.get.mockRejectedValueOnce({ response: { data: {} } })
      const store = useOrganizationSubscriptionsStore()

      await expect(store.loadOrganizationSubscription('org-1')).rejects.toBeDefined()
      expect(store.error).toBe('organizationSubscriptions.loadError')
    })

    it('toggles isLoading true during flight, false after success', async () => {
      const d = deferred<any>()
      mockedAxios.get.mockReturnValueOnce(d.promise)
      const store = useOrganizationSubscriptionsStore()

      const p = store.loadOrganizationSubscription('org-1')
      expect(store.isLoading).toBe(true)

      d.resolve({ data: { data: { id: 'sub-1' } } })
      await p
      expect(store.isLoading).toBe(false)
    })

    it('resets isLoading to false after a failure', async () => {
      mockedAxios.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 500, data: {} } })
      const store = useOrganizationSubscriptionsStore()

      await expect(store.loadOrganizationSubscription('org-1')).rejects.toBeDefined()
      expect(store.isLoading).toBe(false)
    })

    it('demo mode short-circuits without hitting axios and returns a demo payload', async () => {
      mockedIsDemoMode.mockReturnValue(true)
      const store = useOrganizationSubscriptionsStore()

      const result = await store.loadOrganizationSubscription('org-42')

      expect(mockedAxios.get).not.toHaveBeenCalled()
      expect(result.id).toBe('demo-org-sub-org-42')
      expect(result.organization_id).toBe('org-42')
    })
  })

  describe('subscribeOrganization', () => {
    it('POSTs /organizations/:id/subscribe with the payload and unwraps response.data.data', async () => {
      const payload = { id: 'sub-9', status: 'active' }
      mockedAxios.post.mockResolvedValueOnce({ data: { data: payload } })
      const store = useOrganizationSubscriptionsStore()

      const result = await store.subscribeOrganization('org-1', { subscription_plan_id: 'plan-1' })

      expect(mockedAxios.post).toHaveBeenCalledWith('/organizations/org-1/subscribe', {
        subscription_plan_id: 'plan-1'
      })
      expect(result).toBe(payload)
    })

    it('unwraps a bare response.data payload', async () => {
      const payload = { id: 'sub-10' }
      mockedAxios.post.mockResolvedValueOnce({ data: payload })
      const store = useOrganizationSubscriptionsStore()

      const result = await store.subscribeOrganization('org-1', { subscription_plan_id: 'plan-1' })

      expect(result).toBe(payload)
    })

    it('rejects with the planRequired key and never calls axios when plan id is missing', async () => {
      const store = useOrganizationSubscriptionsStore()

      await expect(
        store.subscribeOrganization('org-1', { subscription_plan_id: '' } as any)
      ).rejects.toThrow('organizationSubscriptions.planRequired')
      expect(mockedAxios.post).not.toHaveBeenCalled()
      expect(store.error).toBe('organizationSubscriptions.planRequired')
      expect(store.isLoading).toBe(false)
    })

    it('surfaces error_message into error.value on a failed subscribe', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 402, data: { error_message: 'card declined' } }
      })
      const store = useOrganizationSubscriptionsStore()

      await expect(
        store.subscribeOrganization('org-1', { subscription_plan_id: 'plan-1' })
      ).rejects.toBeDefined()
      expect(store.error).toBe('card declined')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('cancelOrganizationSubscription', () => {
    it('DELETEs /organizations/:id/subscription with cancel_at_period_end in the request body', async () => {
      mockedAxios.delete.mockResolvedValueOnce({})
      const store = useOrganizationSubscriptionsStore()

      const result = await store.cancelOrganizationSubscription('org-1', true)

      expect(mockedAxios.delete).toHaveBeenCalledWith('/organizations/org-1/subscription', {
        data: { cancel_at_period_end: true }
      })
      expect(result).toBeUndefined()
    })

    it('defaults cancel_at_period_end to true when the flag is omitted', async () => {
      mockedAxios.delete.mockResolvedValueOnce({})
      const store = useOrganizationSubscriptionsStore()

      await store.cancelOrganizationSubscription('org-1')

      expect(mockedAxios.delete).toHaveBeenCalledWith('/organizations/org-1/subscription', {
        data: { cancel_at_period_end: true }
      })
    })

    it('passes cancel_at_period_end false through unchanged', async () => {
      mockedAxios.delete.mockResolvedValueOnce({})
      const store = useOrganizationSubscriptionsStore()

      await store.cancelOrganizationSubscription('org-1', false)

      expect(mockedAxios.delete).toHaveBeenCalledWith('/organizations/org-1/subscription', {
        data: { cancel_at_period_end: false }
      })
    })

    it('surfaces error_message into error.value and resets isLoading on failure', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 403, data: { error_message: 'not allowed' } }
      })
      const store = useOrganizationSubscriptionsStore()

      await expect(store.cancelOrganizationSubscription('org-1')).rejects.toBeDefined()
      expect(store.error).toBe('not allowed')
      expect(store.isLoading).toBe(false)
    })

    it('demo mode short-circuits without hitting axios', async () => {
      mockedIsDemoMode.mockReturnValue(true)
      const store = useOrganizationSubscriptionsStore()

      await store.cancelOrganizationSubscription('org-1')

      expect(mockedAxios.delete).not.toHaveBeenCalled()
    })
  })

  describe('loadOrganizationFeatures', () => {
    it('GETs /organizations/:id/features and unwraps response.data.data', async () => {
      const payload = { organization_id: 'org-1', has_active_subscription: true, features: ['group_management'] }
      mockedAxios.get.mockResolvedValueOnce({ data: { data: payload } })
      const store = useOrganizationSubscriptionsStore()

      const result = await store.loadOrganizationFeatures('org-1')

      expect(mockedAxios.get).toHaveBeenCalledWith('/organizations/org-1/features')
      expect(result).toBe(payload)
    })

    it('unwraps a bare response.data payload', async () => {
      const payload = { organization_id: 'org-1', has_active_subscription: false, features: [] }
      mockedAxios.get.mockResolvedValueOnce({ data: payload })
      const store = useOrganizationSubscriptionsStore()

      const result = await store.loadOrganizationFeatures('org-1')

      expect(result).toBe(payload)
    })

    it('surfaces error_message into error.value and resets isLoading on failure', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 500, data: { error_message: 'features unavailable' } }
      })
      const store = useOrganizationSubscriptionsStore()

      await expect(store.loadOrganizationFeatures('org-1')).rejects.toBeDefined()
      expect(store.error).toBe('features unavailable')
      expect(store.isLoading).toBe(false)
    })

    it('falls back to the loadError key for an unknown-shape error', async () => {
      mockedAxios.get.mockRejectedValueOnce({ response: { data: {} } })
      const store = useOrganizationSubscriptionsStore()

      await expect(store.loadOrganizationFeatures('org-1')).rejects.toBeDefined()
      expect(store.error).toBe('organizationSubscriptions.loadError')
    })
  })
})
