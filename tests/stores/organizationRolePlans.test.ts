/**
 * RED phase — organizationRolePlans store (MR-5).
 *
 * Pins the POST-refactor contract: the store is rebuilt as
 * `{ ...useBaseStore(), <named wrappers> }` so its named methods delegate to the
 * base-store CRUD helpers and drive the shared base `entities` state. This
 * supersedes the earlier #267 characterization of the hand-rolled store: MR-5 is
 * NOT behavior-neutral, so a few incidental behaviors the old file pinned change
 * on purpose and are intentionally no longer asserted (see "Deliberately dropped"
 * below).
 *
 * AdminOrgPlanModal is the only consumer; its usage defines the load contract:
 *   - loadOrganizationRolePlans(orgId) RETURNS the array of overrides
 *     (`overrides.forEach(...)` in loadRoleOverrides) and populates base entities.
 *   - error must land in `store.error` (read as a fallback in the modal's catch).
 * create/update/delete return values are NOT consumed (they are awaited inside a
 * Promise.all in saveRoleOverrides), so this spec pins their observable effects —
 * the HTTP verb/URL/body and the resulting base `entities` state — not their
 * return shape.
 *
 * RED against the current hand-rolled store: every assertion on base `entities`
 * (load populates, create appends, update replaces, delete removes) FAILS today
 * because the current store exposes no `entities`. The URL/verb/isLoading/error
 * assertions already pass and guard against regressions during the migration.
 *
 * Deliberately dropped from the #267 characterization (they pin base-internal or
 * consumer-irrelevant behavior the final design changes):
 *   - create/update returning the *inner* response.data.data (base returns the
 *     whole response.data, and no consumer reads the value)
 *   - delete resolving `undefined` (base resolves `true`)
 *   - the demo-mode create payload id string (base mints `demo_<ts>`)
 *   - the store-specific `organizationRolePlans.loadError` fallback key (base uses
 *     its generic key; the axios `error_message` extraction still holds, so that
 *     is what we pin instead)
 *
 * handleStoreError is NOT mocked, so real message extraction runs post-migration.
 * t() is a passthrough (useStoreTranslations mocked → key).
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

// isDemoMode default false → methods hit axios. Demo tests flip it on.
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

describe('organizationRolePlans store (MR-5 base-store refactor)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockedIsDemoMode.mockReturnValue(false)
  })

  describe('loadOrganizationRolePlans', () => {
    it('GETs the org-scoped list endpoint and returns the unwrapped array', async () => {
      const plans = [
        { id: 'rp-1', organization_id: 'org-A', role: 'member', subscription_plan_id: 'plan-A' },
        { id: 'rp-3', organization_id: 'org-A', role: 'manager', subscription_plan_id: 'plan-C' }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: { data: plans } })
      const store = useOrganizationRolePlansStore()

      const result = await store.loadOrganizationRolePlans('org-A')

      expect(mockedAxios.get).toHaveBeenCalledWith('/organizations/org-A/role-plans')
      // The modal does `overrides.forEach(...)`, so the return must be the array.
      expect(result.map((rp: any) => rp.id)).toEqual(['rp-1', 'rp-3'])
    })

    it('returns a bare response.data array (no nested .data) as-is', async () => {
      const plans = [
        { id: 'rp-2', organization_id: 'org-B', role: 'owner', subscription_plan_id: 'plan-B' }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: plans })
      const store = useOrganizationRolePlansStore()

      const result = await store.loadOrganizationRolePlans('org-B')

      expect(result.map((rp: any) => rp.id)).toEqual(['rp-2'])
    })

    it('populates the base entities state with the fetched plans', async () => {
      const plans = [
        { id: 'rp-1', organization_id: 'org-A', role: 'member', subscription_plan_id: 'plan-A' },
        { id: 'rp-2', organization_id: 'org-A', role: 'owner', subscription_plan_id: 'plan-B' }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: { data: plans } })
      const store = useOrganizationRolePlansStore()

      await store.loadOrganizationRolePlans('org-A')

      expect(store.entities).toHaveLength(2)
      expect(store.entities.map((e: any) => e.id)).toEqual(['rp-1', 'rp-2'])
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

    it('surfaces the axios error_message into error.value and resets isLoading on rejection', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 500, data: { error_message: 'load boom' } }
      })
      const store = useOrganizationRolePlansStore()

      await expect(store.loadOrganizationRolePlans('org-A')).rejects.toBeDefined()
      expect(store.error).toBe('load boom')
      expect(store.isLoading).toBe(false)
    })

    it('demo mode short-circuits without hitting axios and returns an empty list', async () => {
      mockedIsDemoMode.mockReturnValue(true)
      const store = useOrganizationRolePlansStore()

      const result = await store.loadOrganizationRolePlans('org-A')

      expect(mockedAxios.get).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('createRolePlan', () => {
    const input = { organization_id: 'org-A', role: 'manager', subscription_plan_id: 'plan-C' }

    it('POSTs the flat /organization-role-plans resource with the payload', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { id: 'rp-new', ...input } })
      const store = useOrganizationRolePlansStore()

      await store.createRolePlan(input)

      expect(mockedAxios.post).toHaveBeenCalledWith('/organization-role-plans', input)
    })

    it('appends the created plan to the base entities state', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { id: 'rp-new', ...input } })
      const store = useOrganizationRolePlansStore()

      await store.createRolePlan(input)

      expect(store.entities).toHaveLength(1)
      expect(store.entities[0]).toMatchObject({ id: 'rp-new', role: 'manager' })
    })

    it('surfaces the axios error_message into error.value and resets isLoading on failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 409, data: { error_message: 'already exists' } }
      })
      const store = useOrganizationRolePlansStore()

      await expect(store.createRolePlan(input)).rejects.toBeDefined()
      expect(store.error).toBe('already exists')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('updateRolePlan', () => {
    it('PATCHes /organization-role-plans/:id with the payload (not PUT)', async () => {
      const patch = { subscription_plan_id: 'plan-Z' }
      mockedAxios.patch.mockResolvedValueOnce({ data: { id: 'rp-1', ...patch } })
      const store = useOrganizationRolePlansStore()

      await store.updateRolePlan('rp-1', patch)

      expect(mockedAxios.patch).toHaveBeenCalledWith('/organization-role-plans/rp-1', patch)
    })

    it('replaces the matching plan in the base entities state', async () => {
      const plans = [
        { id: 'rp-1', organization_id: 'org-A', role: 'member', subscription_plan_id: 'plan-A' },
        { id: 'rp-2', organization_id: 'org-A', role: 'owner', subscription_plan_id: 'plan-B' }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: { data: plans } })
      mockedAxios.patch.mockResolvedValueOnce({
        data: { id: 'rp-1', organization_id: 'org-A', role: 'member', subscription_plan_id: 'plan-Z' }
      })
      const store = useOrganizationRolePlansStore()
      await store.loadOrganizationRolePlans('org-A')

      await store.updateRolePlan('rp-1', { subscription_plan_id: 'plan-Z' })

      const updated = store.entities.find((e: any) => e.id === 'rp-1')
      expect(updated!.subscription_plan_id).toBe('plan-Z')
      expect(store.entities).toHaveLength(2)
    })
  })

  describe('deleteRolePlan', () => {
    it('DELETEs /organization-role-plans/:id', async () => {
      mockedAxios.delete.mockResolvedValueOnce({})
      const store = useOrganizationRolePlansStore()

      await store.deleteRolePlan('rp-1')

      expect(mockedAxios.delete).toHaveBeenCalledWith('/organization-role-plans/rp-1')
    })

    it('removes the deleted plan from the base entities state', async () => {
      const plans = [
        { id: 'rp-1', organization_id: 'org-A', role: 'member', subscription_plan_id: 'plan-A' },
        { id: 'rp-2', organization_id: 'org-A', role: 'owner', subscription_plan_id: 'plan-B' }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: { data: plans } })
      mockedAxios.delete.mockResolvedValueOnce({})
      const store = useOrganizationRolePlansStore()
      await store.loadOrganizationRolePlans('org-A')

      await store.deleteRolePlan('rp-1')

      expect(store.entities).toHaveLength(1)
      expect(store.entities.map((e: any) => e.id)).toEqual(['rp-2'])
    })
  })
})
