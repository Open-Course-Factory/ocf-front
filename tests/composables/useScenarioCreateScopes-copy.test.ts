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
  )
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
