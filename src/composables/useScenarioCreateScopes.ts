/**
 * useScenarioCreateScopes
 * ───────────────────────
 * Where a new scenario may be put: the platform (admin only), an organization
 * or a class the user manages. Shared by the editor's create flow and the
 * scenario import, which write to the same three places:
 *   - platform → POST /scenarios[/upload|/import-json]                 (admin only)
 *   - org      → POST /organizations/:id/scenarios[/upload|/import-json] (org teacher+)
 *   - group    → POST /groups/:id/scenarios[/upload|/import-json]        (group manager+, auto-assigns)
 *
 * Both scope lists trust the backend's `user_member_id` filter applied by
 * GET /organizations and GET /class-groups (#216 — filtering by
 * `owner_user_id === userId` was creator-match, not membership-match, and hid
 * groups the user was added to but didn't create). Organisations are narrowed
 * by role on top: membership alone is any role, and ocf-core authors scenarios
 * in an org from teacher up (admins: any org).
 *
 * Scope keys (`org:<id>`, `group:<id>`, `platform:*`) are what the pickers bind.
 */
import { computed } from 'vue'
import { useOrganizationsStore } from '../stores/organizations'
import { useClassGroupsStore } from '../stores/classGroups'
import { useUserMembershipsStore } from '../stores/userMemberships'
import { useAdminViewMode } from './useAdminViewMode'
import { useScenarioEditorAccess } from './useScenarioEditorAccess'

export type CreateScope =
  | { kind: 'platform' }
  | { kind: 'org', id: string, name: string }
  | { kind: 'group', id: string, name: string }

export function useScenarioCreateScopes() {
  const organizationsStore = useOrganizationsStore()
  const classGroupsStore = useClassGroupsStore()
  const membershipsStore = useUserMembershipsStore()
  const { isAdmin } = useAdminViewMode()
  const { canAccessScenarioEditor } = useScenarioEditorAccess()

  const allGroups = computed<any[]>(() => {
    // classGroupsStore.entities (from useBaseStore) holds the loaded list
    const anyStore = classGroupsStore as any
    return (anyStore.entities || []) as any[]
  })

  const orgScopes = computed<Array<{ id: string; name: string }>>(() =>
    organizationsStore.userOrganizations
      .filter((o: any) => isAdmin.value || membershipsStore.canAuthorInOrg(o.id))
      .map((o: any) => ({
        id: o.id,
        name: o.display_name || o.name || `Organization ${String(o.id).slice(0, 8)}`,
      })),
  )

  const groupScopes = computed<Array<{ id: string; name: string }>>(() =>
    allGroups.value.map((g: any) => ({
      id: g.id,
      name: g.display_name || g.name || `Group ${String(g.id).slice(0, 8)}`,
    })),
  )

  const platformScopeAvailable = computed(() => isAdmin.value)

  const availableCreateScopes = computed<CreateScope[]>(() => {
    const scopes: CreateScope[] = []
    if (platformScopeAvailable.value) scopes.push({ kind: 'platform' })
    for (const s of orgScopes.value) scopes.push({ kind: 'org', id: s.id, name: s.name })
    for (const s of groupScopes.value) scopes.push({ kind: 'group', id: s.id, name: s.name })
    return scopes
  })

  // Gated on `canAccessScenarioEditor` so the boolean stays DRY with the menu
  // and router-guard surfaces (#213); the scope list only adds "and there is
  // somewhere to put it".
  const canCreateScenario = computed(() =>
    canAccessScenarioEditor.value && availableCreateScopes.value.length > 0
  )

  const parseScopeKey = (key: string | undefined | null): CreateScope | null => {
    if (!key) return null
    const idx = key.indexOf(':')
    if (idx === -1) return null
    const kind = key.slice(0, idx)
    const id = key.slice(idx + 1)
    if (kind === 'platform') return { kind: 'platform' }
    if (kind === 'org') {
      const org = organizationsStore.userOrganizations.find(o => o.id === id)
      return { kind: 'org', id, name: org?.display_name || org?.name || id }
    }
    if (kind === 'group') {
      const group = allGroups.value.find((g: any) => g.id === id)
      return { kind: 'group', id, name: group?.display_name || group?.name || id }
    }
    return null
  }

  const pickDefaultScopeKey = (): string => {
    // 1. currentOrganization if the user may author in it
    const currentOrgId = organizationsStore.currentOrganization?.id
    if (currentOrgId && orgScopes.value.some(o => o.id === currentOrgId)) {
      return `org:${currentOrgId}`
    }
    // 2. first available org scope
    if (orgScopes.value.length > 0) {
      return `org:${orgScopes.value[0].id}`
    }
    // 3. first available group scope
    if (groupScopes.value.length > 0) {
      return `group:${groupScopes.value[0].id}`
    }
    // 4. platform if admin
    if (platformScopeAvailable.value) return 'platform:*'
    return ''
  }

  // The scope whose import updates `scenario` in place, or '' when the user
  // has none. Every import route upserts by title within the destination's
  // organization (ScenarioSeedService.SeedScenario), so it has to be the
  // scenario's own: its organization when the user manages it, else one of
  // the user's classes in that organization (which also assigns the scenario
  // to that class), else the platform for a platform scenario.
  const scopeKeyForScenario = (scenario: { organization_id?: string | null }): string => {
    const orgId = scenario.organization_id
    if (!orgId) return platformScopeAvailable.value ? 'platform:*' : ''
    if (membershipsStore.canManageOrg(orgId)) return `org:${orgId}`
    const group = allGroups.value.find((g: any) => g.organization_id === orgId)
    return group ? `group:${group.id}` : ''
  }

  // The lists the scopes are read from. Failures leave a list empty rather
  // than failing the caller: a missing scope only narrows the picker.
  const loadScopeSources = () => Promise.all([
    organizationsStore.loadOrganizations().catch(() => null),
    classGroupsStore.loadEntities().catch(() => null),
    membershipsStore.ensureLoaded().catch(() => null),
  ])

  return {
    allGroups,
    orgScopes,
    groupScopes,
    platformScopeAvailable,
    availableCreateScopes,
    canCreateScenario,
    parseScopeKey,
    pickDefaultScopeKey,
    scopeKeyForScenario,
    loadScopeSources,
  }
}
