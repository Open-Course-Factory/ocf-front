import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useStoreTranslations } from '../composables/useTranslations'
import { useCurrentUserStore } from './currentUser'
import { isDemoMode, logDemoAction } from '../services/demo'
import { useUserMembershipsStore } from './userMemberships'
import type { UserEffectiveFeatures } from '../types'

// Never persisted: everything here is what the backend decides for the
// signed-in user and is reloaded at boot. A restored `can_run_classrooms`
// opened the Groups pages to a Découverte owner on a browser another account
// had used.
export const usePermissionsStore = defineStore('permissions', () => {
  const effectiveFeatures = ref<UserEffectiveFeatures | null>(null)
  const allOrgFeatures = ref<UserEffectiveFeatures | null>(null)
  const isLoading = ref(false)
  const error = ref('')

  // Translations
  const { t } = useStoreTranslations({
    en: {
      permissions: {
        loadError: 'Failed to load user permissions',
        notAuthorized: 'You are not authorized to perform this action',
      }
    },
    fr: {
      permissions: {
        loadError: 'Échec du chargement des permissions',
        notAuthorized: 'Vous n\'êtes pas autorisé à effectuer cette action',
      }
    }
  })

  /**
   * The one request that answers "what does this user get, and may they run
   * classes, in this organization?" — GET /users/me/features scoped to it, or
   * unscoped for the aggregate. Every reader of the verdict goes through here so
   * the sidebar and an organization's own page cannot ask two different questions.
   */
  const fetchEffectiveFeatures = async (orgId?: string | null): Promise<UserEffectiveFeatures> => {
    const url = orgId
      ? `/users/me/features?organization_id=${orgId}`
      : '/users/me/features'
    const response = await axios.get(url)
    return response.data.data || response.data
  }

  /**
   * "May this user run classes in THAT organization?" — for a screen showing an
   * organization other than the one in context, which the organization page does.
   *
   * Reads the backend's verdict only; it neither reconstructs it from the
   * features list nor touches `effectiveFeatures`, which describes the current
   * context and drives the sidebar. A verdict that cannot be fetched is a
   * refusal: absent must never read as yes.
   */
  const classroomVerdictFor = (orgId: string): Promise<boolean> =>
    fetchEffectiveFeatures(orgId).then(features => features?.can_run_classrooms === true, () => false)

  // Load effective features for current org context + all orgs (for gray-out logic)
  const loadEffectiveFeatures = async () => {
    isLoading.value = true
    error.value = ''
    try {
      if (isDemoMode()) {
        logDemoAction('loadEffectiveFeatures')
        effectiveFeatures.value = {
          user_id: 'demo-user-1',
          effective_features: {
            id: 'effective-plan',
            name: 'Aggregated Features',
            priority: 30,
            stripe_product_id: '',
            stripe_price_id: '',
            price_amount: 0,
            currency: 'EUR',
            billing_interval: 'month',
            features: ['group_management', 'multiple_groups', 'network_access', 'data_persistence', 'command_history', 'session_supervision'],
            max_courses: 50,
            is_active: true,
            required_role: 'member',
            max_session_duration_minutes: 240,
            max_cpu: 16,
            max_memory_mb: 16384,
            network_access_enabled: true,
            data_persistence_enabled: true,
            data_persistence_gb: 50,
            allowed_backends: [],
            default_backend: '',
            command_history_retention_days: 30,
            use_tiered_pricing: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          source_organizations: [
            {
              organization_id: 'demo-org-1',
              organization_name: 'Demo Organization',
              role: 'owner',
              contributing_features: ['group_management', 'network_access'],
            }
          ],
          has_personal_subscription: false,
          // The demo persona is a trainer with a classroom-granting plan, so the
          // verdict must say so. Omitting it would make demo mode deny every
          // classroom affordance, since an absent verdict is read as "no".
          can_run_classrooms: true,
        }
        allOrgFeatures.value = effectiveFeatures.value
        return effectiveFeatures.value
      }

      // Get org context for scoped features
      const { useOrganizationsStore } = await import('./organizations')
      const orgStore = useOrganizationsStore()
      const orgId = orgStore.currentOrganizationId

      // Current context features (scoped to current org)
      effectiveFeatures.value = await fetchEffectiveFeatures(orgId)

      // All features across all orgs (for gray-out logic)
      try {
        const allResponse = await axios.get('/users/me/features')
        allOrgFeatures.value = allResponse.data.data || allResponse.data
      } catch {
        allOrgFeatures.value = null
      }

      return effectiveFeatures.value
    } catch (err: any) {
      error.value = err.response?.data?.error_message || err.message || t('permissions.loadError')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load the effective features once, and only once, when several screens on the
   * same page each need them.
   *
   * `loadEffectiveFeatures` always refetches, which is what an organization switch
   * wants and what a mounting component does not: a page and the components inside
   * it mount in sequence, each finding the state still empty because the first
   * request has not come back yet, and each firing its own.
   *
   * Deliberately "loaded", not "fresh": a caller that needs the current answer —
   * after a backend refusal, after switching organization — calls
   * `loadEffectiveFeatures` directly.
   */
  let inFlightFeatures: Promise<UserEffectiveFeatures | null> | null = null

  const ensureEffectiveFeaturesLoaded = async (): Promise<UserEffectiveFeatures | null> => {
    // Keyed on `effectiveFeatures` alone. `allOrgFeatures` comes from the
    // org-less aggregate, which 404s for a user whose only subscription is
    // personal — testing it here would make "loaded" unreachable for them and
    // turn every mount into another round trip.
    if (effectiveFeatures.value) return effectiveFeatures.value
    if (!inFlightFeatures) {
      inFlightFeatures = loadEffectiveFeatures().finally(() => {
        inFlightFeatures = null
      })
    }
    return inFlightFeatures
  }

  /**
   * The one way to re-ask the backend what this user may do now.
   *
   * The navigation decides whether the groups tab is live from three snapshots:
   * `view_groups` in the current-user store (GET /auth/permissions), and
   * `can_run_classrooms` plus the `group_management` plan feature in
   * `effectiveFeatures` (GET /users/me/features). Both are taken at boot and
   * only ever retaken on an organization switch, so an action that changes the
   * answer without one — creating or converting an organization, buying or
   * being assigned a plan, being promoted, creating the first class — left the
   * tab grayed until the user switched organization away and back.
   *
   * Every such completion path calls this. It never rejects: a stale menu is a
   * degraded screen, not a failed action, and the action it follows has already
   * succeeded. Each request is settled on its own so one failing cannot keep the
   * other answer stale too.
   */
  const refreshEntitlements = async (): Promise<void> => {
    const outcomes = await Promise.allSettled([
      loadEffectiveFeatures(),
      useCurrentUserStore().loadPermissions(),
    ])
    for (const outcome of outcomes) {
      if (outcome.status === 'rejected') {
        console.warn('Failed to refresh entitlements:', outcome.reason)
      }
    }
  }

  /**
   * Check if a feature is available in any org (for gray-out logic).
   * Returns true if the feature exists in allOrgFeatures but might not be in current context.
   */
  const isFeatureInAnyOrg = (featureName: string): boolean => {
    if (!allOrgFeatures.value) return false
    const allFeatures = allOrgFeatures.value.effective_features?.features || []
    return allFeatures.includes(featureName)
  }

  /**
   * Find which org provides a specific feature (for tooltip).
   * Returns the org name that contributes this feature, or null.
   */
  const getOrgWithFeature = (featureName: string): string | null => {
    if (!allOrgFeatures.value?.source_organizations) return null
    for (const org of allOrgFeatures.value.source_organizations) {
      if (org.contributing_features?.includes(featureName)) {
        return org.organization_name
      }
    }
    return null
  }

  // ==========================================
  // SYSTEM ROLE CHECKS
  // ==========================================

  const isSystemAdmin = computed((): boolean => {
    // Use auth store as single source of truth — populated from /auth/me which includes roles
    const authStore = useCurrentUserStore()
    return authStore.userRoles?.includes('administrator') ?? false
  })

  // ==========================================
  // ORGANIZATION ROLE CHECKS
  // ==========================================

  // Memberships come from the store loaded at startup, the one every page has.
  const isOrganizationOwner = (organizationId: string): boolean =>
    isSystemAdmin.value || useUserMembershipsStore().getOrgRole(organizationId) === 'owner'

  const canManageOrganization = (organizationId: string): boolean =>
    isSystemAdmin.value || useUserMembershipsStore().canManageOrg(organizationId)

  // ==========================================
  // FEATURE CHECKS
  // ==========================================

  const hasFeature = (featureName: string): boolean => {
    if (!effectiveFeatures.value) return false
    return effectiveFeatures.value.effective_features.features?.includes(featureName) ?? false
  }

  // ==========================================
  // OWNER-ONLY PERMISSION CHECKS
  // ==========================================

  const canDeleteOrganization = (organizationId: string): boolean => {
    return isSystemAdmin.value || isOrganizationOwner(organizationId)
  }

  return {
    // State
    effectiveFeatures,
    allOrgFeatures,
    isLoading,
    error,

    // Actions
    loadEffectiveFeatures,
    ensureEffectiveFeaturesLoaded,
    classroomVerdictFor,
    refreshEntitlements,
    isFeatureInAnyOrg,
    getOrgWithFeature,

    // System role checks
    isSystemAdmin,

    // Organization role checks
    isOrganizationOwner,
    canManageOrganization,

    // Feature checks
    hasFeature,

    // Owner-only permission checks
    canDeleteOrganization,

    // Translations
    t,
  }
}, { persist: false })
