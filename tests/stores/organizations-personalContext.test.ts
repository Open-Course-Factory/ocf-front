/**
 * Teaching never happens in a personal organization (product decision #315;
 * enforced backend-side in core #475, which turns `can_run_classrooms` off for
 * personal organizations and refuses to create a class in one).
 *
 * The front needs that verdict by ORGANISATION TYPE alone, and by one rule:
 * three shapes of "is personal" used to coexist, one of them demanding a
 * single member, and they disagreed on a personal organization whose member
 * count was absent or unexpected (#316). isPersonalOrganizationRecord is the
 * rule; the context computed and every other reader delegate to it.
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
    // A member-count clause once made a second predicate disagree here; the
    // rule is about the type, whatever the count says.
    const store = storeShowing([{ ...personalOrg, member_count: 3 }], personalOrg.id)

    expect(store.isPersonalOrganizationContext).toBe(true)
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
