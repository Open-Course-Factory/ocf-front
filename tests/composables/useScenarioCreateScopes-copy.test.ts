/**
 * Where a copy of a scenario may go. A platform scenario is copied into any
 * organization or class the user authors in; an organization's scenario never
 * leaves its organization (ocf-core refuses), so only that organization and the
 * user's classes in it are offered — how a teacher copies a colleague's lab.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useScenarioCreateScopes } from '../../src/composables/useScenarioCreateScopes'
import { useOrganizationsStore } from '../../src/stores/organizations'
import { useClassGroupsStore } from '../../src/stores/classGroups'
import { useUserMembershipsStore } from '../../src/stores/userMemberships'
import { useCurrentUserStore } from '../../src/stores/currentUser'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  const user = useCurrentUserStore()
  user.userId = 'user-1'
  user.userRoles = []
  ;(useOrganizationsStore() as any).entities.splice(0, Infinity,
    { id: 'org-a', name: 'A', organization_type: 'team' },
    { id: 'org-b', name: 'B', organization_type: 'team' },
    { id: 'org-c', name: 'C (member only)', organization_type: 'team' },
  )
  ;(useClassGroupsStore() as any).entities.splice(0, Infinity,
    { id: 'class-a', name: 'Class of A', organization_id: 'org-a' },
    { id: 'class-b', name: 'Class of B', organization_id: 'org-b' },
    // A class the user attends as a student: listed by GET /class-groups.
    { id: 'class-learner', name: 'Class I attend', organization_id: 'org-c' },
  )
  useUserMembershipsStore().groupMemberships = [
    { group_id: 'class-a', role: 'manager' },
    { group_id: 'class-b', role: 'owner' },
    { group_id: 'class-learner', role: 'member' },
  ]
  useUserMembershipsStore().orgMemberships = [
    { organization_id: 'org-a', role: 'teacher' },
    { organization_id: 'org-b', role: 'manager' },
    { organization_id: 'org-c', role: 'member' },
  ]
})

const ids = (list: Array<{ id: string }>) => list.map(item => item.id)

describe('useScenarioCreateScopes.copyScopesFor', () => {
  it('offers every authoring organization and class for a platform scenario', () => {
    const { orgs, groups } = useScenarioCreateScopes().copyScopesFor({ organization_id: null })
    expect(ids(orgs)).toEqual(['org-a', 'org-b'])
    expect(ids(groups)).toEqual(['class-a', 'class-b'])
  })

  it("keeps an organization's scenario inside it", () => {
    const { orgs, groups } = useScenarioCreateScopes().copyScopesFor({ organization_id: 'org-a' })
    expect(ids(orgs)).toEqual(['org-a'])
    expect(ids(groups)).toEqual(['class-a'])
  })

  it('offers nothing for a scenario of an organization the user only belongs to', () => {
    const { orgs, groups } = useScenarioCreateScopes().copyScopesFor({ organization_id: 'org-c' })
    expect(orgs).toEqual([])
    expect(groups).toEqual([])
  })
})

// A class the user attends as a student is listed by GET /class-groups, but
// ocf-core puts a scenario in a class only for its managers.
describe('useScenarioCreateScopes.groupScopes', () => {
  it('offers only the classes the user manages', () => {
    expect(ids(useScenarioCreateScopes().groupScopes.value)).toEqual(['class-a', 'class-b'])
  })

  it('does not import into, nor copy into, a class the user only attends', () => {
    const scopes = useScenarioCreateScopes()
    expect(ids(scopes.copyScopesFor({ organization_id: 'org-c' }).groups)).toEqual([])
    expect(scopes.scopeKeyForScenario({ organization_id: 'org-c' })).toBe('')
  })
})

