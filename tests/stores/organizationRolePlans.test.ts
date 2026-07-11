/**
 * CHARACTERIZATION — organizationRolePlans store (refactor #267, finding I3).
 *
 * Pins the CURRENT observable behavior of the hand-rolled isLoading/error +
 * try/catch in src/stores/organizationRolePlans.ts BEFORE it is migrated onto
 * the base-store async helpers. GREEN today; must stay GREEN through a
 * behavior-neutral refactor.
 *
 * What is pinned:
 *   - which endpoint + HTTP verb each method calls
 *   - the `response.data?.data || response.data` unwrap (wrapped and bare shapes)
 *   - loadOrganizationRolePlans hits the org-SCOPED endpoint
 *     GET /organizations/:id/role-plans (core !286, part of #386) and returns its
 *     payload AS-IS — the backend now filters server-side (OrgRole manager+, admin
 *     bypass), so there is no client-side filter left to pin.
 *   - the error fallback landing in error.value
 *   - isLoading true during flight, false after BOTH success and failure
 *   - demo-mode short-circuit (no network)
 *
 * As in the sibling org-subscriptions test, error shapes describe the contract a
 * correct migration onto handleStoreError preserves (axios error_message,
 * unknown-shape → fallback key). handleStoreError is NOT mocked. t() is a
 * passthrough so a routed fallback resolves to its translation key.
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

vi.mock('../../src/services/demo', () => ({
  isDemoMode: vi.fn(() => false),
  logDemoAction: vi.fn(),
  simulateDelay: vi.fn()
}))

import axios from 'axios'
import { isDemoMode } from '../../src/services/demo'
import { useOrganizationRolePlansStore } from '../../src/stores/organizationRolePlans'

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}
const mockedIsDemoMode = isDemoMode as unknown as ReturnType<typeof vi.fn>

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('organizationRolePlans store (characterization #267)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockedIsDemoMode.mockReturnValue(false)
  })

  describe('loadOrganizationRolePlans', () => {
    it('GETs the org-scoped /organizations/:id/role-plans and returns the wrapped payload as-is', async () => {
      const scoped = [
        { id: 'rp-1', organization_id: 'org-A', role: 'member', subscription_plan_id: 'plan-A' },
        { id: 'rp-3', organization_id: 'org-A', role: 'manager', subscription_plan_id: 'plan-C' }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: { data: scoped } })
      const store = useOrganizationRolePlansStore()

      const result = await store.loadOrganizationRolePlans('org-A')

      expect(mockedAxios.get).toHaveBeenCalledWith('/organizations/org-A/role-plans')
      expect(result.map((rp) => rp.id)).toEqual(['rp-1', 'rp-3'])
    })

    it('returns a bare response.data array (no nested .data) as-is', async () => {
      const scoped = [
        { id: 'rp-2', organization_id: 'org-B', role: 'member', subscription_plan_id: 'plan-B' }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: scoped })
      const store = useOrganizationRolePlansStore()

      const result = await store.loadOrganizationRolePlans('org-B')

      expect(mockedAxios.get).toHaveBeenCalledWith('/organizations/org-B/role-plans')
      expect(result.map((rp) => rp.id)).toEqual(['rp-2'])
    })

    it('returns an empty array when the payload is null/undefined', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: null })
      const store = useOrganizationRolePlansStore()

      const result = await store.loadOrganizationRolePlans('org-A')

      expect(result).toEqual([])
    })

    it('surfaces error_message into error.value and rethrows', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 500, data: { error_message: 'load boom' } }
      })
      const store = useOrganizationRolePlansStore()

      await expect(store.loadOrganizationRolePlans('org-A')).rejects.toBeDefined()
      expect(store.error).toBe('load boom')
    })

    it('falls back to the loadError key for an unknown-shape error', async () => {
      mockedAxios.get.mockRejectedValueOnce({ response: { data: {} } })
      const store = useOrganizationRolePlansStore()

      await expect(store.loadOrganizationRolePlans('org-A')).rejects.toBeDefined()
      expect(store.error).toBe('organizationRolePlans.loadError')
    })

    it('toggles isLoading true during flight, false after success', async () => {
      const d = deferred<any>()
      mockedAxios.get.mockReturnValueOnce(d.promise)
      const store = useOrganizationRolePlansStore()

      const p = store.loadOrganizationRolePlans('org-A')
      expect(store.isLoading).toBe(true)

      d.resolve({ data: { data: [] } })
      await p
      expect(store.isLoading).toBe(false)
    })

    it('resets isLoading to false after a failure', async () => {
      mockedAxios.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 500, data: {} } })
      const store = useOrganizationRolePlansStore()

      await expect(store.loadOrganizationRolePlans('org-A')).rejects.toBeDefined()
      expect(store.isLoading).toBe(false)
    })

    it('demo mode returns an empty array without hitting axios', async () => {
      mockedIsDemoMode.mockReturnValue(true)
      const store = useOrganizationRolePlansStore()

      const result = await store.loadOrganizationRolePlans('org-A')

      expect(mockedAxios.get).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('createRolePlan', () => {
    const input = { organization_id: 'org-A', role: 'manager', subscription_plan_id: 'plan-C' }

    it('POSTs /organization-role-plans with the payload and unwraps response.data.data', async () => {
      const created = { id: 'rp-new', ...input }
      mockedAxios.post.mockResolvedValueOnce({ data: { data: created } })
      const store = useOrganizationRolePlansStore()

      const result = await store.createRolePlan(input)

      expect(mockedAxios.post).toHaveBeenCalledWith('/organization-role-plans', input)
      expect(result).toBe(created)
    })

    it('unwraps a bare response.data payload', async () => {
      const created = { id: 'rp-new', ...input }
      mockedAxios.post.mockResolvedValueOnce({ data: created })
      const store = useOrganizationRolePlansStore()

      const result = await store.createRolePlan(input)

      expect(result).toBe(created)
    })

    it('surfaces error_message into error.value and resets isLoading on failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 409, data: { error_message: 'already exists' } }
      })
      const store = useOrganizationRolePlansStore()

      await expect(store.createRolePlan(input)).rejects.toBeDefined()
      expect(store.error).toBe('already exists')
      expect(store.isLoading).toBe(false)
    })

    it('demo mode short-circuits without hitting axios', async () => {
      mockedIsDemoMode.mockReturnValue(true)
      const store = useOrganizationRolePlansStore()

      const result = await store.createRolePlan(input)

      expect(mockedAxios.post).not.toHaveBeenCalled()
      expect(result.id).toBe('demo-role-plan-manager')
    })
  })

  describe('updateRolePlan', () => {
    it('PATCHes /organization-role-plans/:id with the payload and unwraps response.data.data', async () => {
      const updated = { id: 'rp-1', subscription_plan_id: 'plan-Z' }
      mockedAxios.patch.mockResolvedValueOnce({ data: { data: updated } })
      const store = useOrganizationRolePlansStore()

      const result = await store.updateRolePlan('rp-1', { subscription_plan_id: 'plan-Z' })

      expect(mockedAxios.patch).toHaveBeenCalledWith('/organization-role-plans/rp-1', {
        subscription_plan_id: 'plan-Z'
      })
      expect(result).toBe(updated)
    })

    it('unwraps a bare response.data payload', async () => {
      const updated = { id: 'rp-1', subscription_plan_id: 'plan-Z' }
      mockedAxios.patch.mockResolvedValueOnce({ data: updated })
      const store = useOrganizationRolePlansStore()

      const result = await store.updateRolePlan('rp-1', { subscription_plan_id: 'plan-Z' })

      expect(result).toBe(updated)
    })

    it('surfaces error_message into error.value and resets isLoading on failure', async () => {
      mockedAxios.patch.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404, data: { error_message: 'not found' } }
      })
      const store = useOrganizationRolePlansStore()

      await expect(store.updateRolePlan('rp-1', { subscription_plan_id: 'plan-Z' })).rejects.toBeDefined()
      expect(store.error).toBe('not found')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('deleteRolePlan', () => {
    it('DELETEs /organization-role-plans/:id and resolves undefined', async () => {
      mockedAxios.delete.mockResolvedValueOnce({})
      const store = useOrganizationRolePlansStore()

      const result = await store.deleteRolePlan('rp-1')

      expect(mockedAxios.delete).toHaveBeenCalledWith('/organization-role-plans/rp-1')
      expect(result).toBeUndefined()
    })

    it('surfaces error_message into error.value and resets isLoading on failure', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 403, data: { error_message: 'forbidden' } }
      })
      const store = useOrganizationRolePlansStore()

      await expect(store.deleteRolePlan('rp-1')).rejects.toBeDefined()
      expect(store.error).toBe('forbidden')
      expect(store.isLoading).toBe(false)
    })

    it('demo mode short-circuits without hitting axios', async () => {
      mockedIsDemoMode.mockReturnValue(true)
      const store = useOrganizationRolePlansStore()

      await store.deleteRolePlan('rp-1')

      expect(mockedAxios.delete).not.toHaveBeenCalled()
    })
  })
})
