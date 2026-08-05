/**
 * Teaching never happens in a personal organization (product decision #315;
 * enforced backend-side in core #475, which turns `can_run_classrooms` off for
 * personal organizations and refuses to create a class in one).
 *
 * The front needs that verdict by ORGANISATION TYPE alone. The store already
 * had `isPersonalOrganization`, but it additionally demands a single member and
 * answers a different question — whether to show the organizations menu at all.
 * A personal organization whose member count is absent or unexpected slips
 * through it, which here would mean offering a teacher a class list and a
 * create button the backend is about to refuse.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: { baseURL: '', timeout: 30000, headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}))

vi.mock('../../src/utils/asyncWrapper', () => ({
  createAsyncWrapper: () => async (fn: () => Promise<any>) => fn(),
}))

import { useOrganizationsStore } from '../../src/stores/organizations'

function storeShowing(organizations: any[], currentId?: string) {
  setActivePinia(createPinia())
  const store = useOrganizationsStore()
  store.entities.splice(0, store.entities.length, ...organizations)
  if (currentId) store.currentOrganizationId = currentId
  return store
}

const personalOrg = {
  id: 'org-personal',
  name: 'marc',
  display_name: 'Marc',
  organization_type: 'personal',
  member_count: 1,
}

const teamOrg = {
  id: 'org-team',
  name: 'marc-corp',
  display_name: 'Marc Corp',
  organization_type: 'team',
  member_count: 4,
}

describe('organizations — personal context', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('recognises a personal organization', () => {
    const store = storeShowing([personalOrg], personalOrg.id)

    expect(store.isPersonalOrganizationContext).toBe(true)
  })

  it('does not flag a team organization', () => {
    const store = storeShowing([teamOrg, personalOrg], teamOrg.id)

    expect(store.isPersonalOrganizationContext).toBe(false)
  })

  it('flags a personal organization whatever its member count says', () => {
    // The member-count clause on `isPersonalOrganization` makes it disagree
    // here; the classroom rule is about the type, so this must not follow it.
    const store = storeShowing([{ ...personalOrg, member_count: 3 }], personalOrg.id)

    expect(store.isPersonalOrganizationContext).toBe(true)
    expect(store.isPersonalOrganization).toBe(false)
  })

  it('accepts the is_personal flag when the type is not spelled out', () => {
    const store = storeShowing(
      [{ id: 'org-x', name: 'x', display_name: 'X', is_personal: true }],
      'org-x',
    )

    expect(store.isPersonalOrganizationContext).toBe(true)
  })

  it('claims nothing when no organization is loaded', () => {
    const store = storeShowing([])

    expect(store.isPersonalOrganizationContext).toBe(false)
  })
})
